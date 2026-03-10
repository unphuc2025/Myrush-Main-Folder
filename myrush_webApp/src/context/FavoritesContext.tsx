import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { favoritesApi, type Venue } from '../api/venues';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
    favorites: Venue[];
    isLoading: boolean;
    isFavorite: (venueId: string) => boolean;
    toggleFavorite: (venueId: string) => Promise<void>;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<Venue[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Persistent set of IDs from localStorage to prevent flicker on refresh
    const [cachedFavoriteIds, setCachedFavoriteIds] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('myrush_favorite_ids');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return new Set(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                console.error('Failed to parse cached favorites', e);
            }
        }
        return new Set();
    });

    // Persistent map: venueId (branch ID) -> courtId
    // This is built up over time as users toggle favorites and survives refreshes
    const venueToCourtMapRef = useRef<Map<string, string>>(new Map());

    const { isAuthenticated } = useAuth();

    /**
     * Declarative set of favorited IDs — includes court IDs + original venue/branch IDs
     * derived automatically from the favorites array + local cache.
     */
    const favoriteIdsSet = useMemo(() => {
        const ids = new Set<string>(cachedFavoriteIds);

        favorites.forEach(fav => {
            // Add Court ID
            if (fav.id) {
                const idStr = String(fav.id).trim().toLowerCase();
                if (idStr && !idStr.startsWith('temp-')) {
                    ids.add(idStr);
                }
            }
            // Add Branch ID
            if (fav.branch_id) {
                const bIdStr = String(fav.branch_id).trim().toLowerCase();
                if (bIdStr) {
                    ids.add(bIdStr);
                }
            }
        });

        // Also include any manually mapped venue IDs from our persistent map
        venueToCourtMapRef.current.forEach((courtId, venueId) => {
            const cleanCourtId = String(courtId).trim().toLowerCase();
            const cleanVenueId = String(venueId).trim().toLowerCase();
            if (ids.has(cleanCourtId)) {
                ids.add(cleanVenueId);
            }
        });

        return ids;
    }, [favorites, cachedFavoriteIds]);

    // Update localStorage whenever favoriteIdsSet changes
    useEffect(() => {
        if (isAuthenticated) {
            const idsArray = Array.from(favoriteIdsSet);
            localStorage.setItem('myrush_favorite_ids', JSON.stringify(idsArray));
        } else {
            localStorage.removeItem('myrush_favorite_ids');
        }
    }, [favoriteIdsSet, isAuthenticated]);

    const refreshFavorites = useCallback(async () => {
        if (!isAuthenticated) {
            setFavorites([]);
            setCachedFavoriteIds(new Set());
            return;
        }

        try {
            setIsLoading(true);
            const response = await favoritesApi.getFavorites();
            if (response.success && Array.isArray(response.data)) {
                setFavorites(response.data);

                // Update cache with fresh data from server
                const freshIds = new Set<string>();
                response.data.forEach((fav: any) => {
                    if (fav.id) freshIds.add(String(fav.id).toLowerCase());
                    if (fav.branch_id) {
                        const bId = String(fav.branch_id).toLowerCase();
                        freshIds.add(bId);
                        if (fav.id) venueToCourtMapRef.current.set(bId, String(fav.id).toLowerCase());
                    }
                });
                setCachedFavoriteIds(freshIds);
            }
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshFavorites();
    }, [refreshFavorites]);

    const isFavorite = useCallback((idToCheck: string) => {
        if (!idToCheck) return false;

        const cleanId = String(idToCheck).trim().toLowerCase();

        // Check 1: Hit in our pre-calculated Set (fastest and includes cache)
        if (favoriteIdsSet.has(cleanId)) return true;

        // Check 2: Direct hit in the favorites array (for robustness)
        return favorites.some(fav => {
            const courtId = fav.id ? String(fav.id).toLowerCase() : null;
            const branchId = fav.branch_id ? String(fav.branch_id).toLowerCase() : null;
            return courtId === cleanId ||
                branchId === cleanId ||
                courtId === `temp-${cleanId}` ||
                `temp-${courtId}` === cleanId;
        });
    }, [favoriteIdsSet, favorites]);

    const toggleFavorite = async (venueId: string) => {
        if (!isAuthenticated) {
            alert('Please login to add favorites');
            return;
        }

        const isCurrentlyFavorite = isFavorite(venueId);
        const previousFavorites = [...favorites];
        const previousCache = new Set(cachedFavoriteIds);

        // --- Optimistic update ---
        if (isCurrentlyFavorite) {
            // Remove locally
            setFavorites(prev => prev.filter(fav => {
                const cId = String(fav.id).toLowerCase();
                const bId = String(fav.branch_id).toLowerCase();
                return cId !== venueId.toLowerCase() && bId !== venueId.toLowerCase();
            }));
            setCachedFavoriteIds(prev => {
                const next = new Set(prev);
                next.delete(venueId.toLowerCase());
                return next;
            });
        } else {
            // Add locally with a placeholder
            const placeholder: any = {
                id: `temp-${venueId}`,
                branch_id: venueId,
                court_name: 'Updating...',
                is_favorite: true
            };
            setFavorites(prev => [...prev, placeholder]);
            setCachedFavoriteIds(prev => {
                const next = new Set(prev);
                next.add(venueId.toLowerCase());
                return next;
            });
        }

        try {
            const response = await favoritesApi.toggleFavorite(venueId);
            if (response.success) {
                if (response.data?.status === 'favorited' && response.data?.court_id) {
                    venueToCourtMapRef.current.set(String(venueId), String(response.data.court_id));
                }
                // Always sync with server to get full real data
                await refreshFavorites();
            } else {
                // Rollback
                setFavorites(previousFavorites);
                setCachedFavoriteIds(previousCache);
            }
        } catch (error) {
            setFavorites(previousFavorites);
            setCachedFavoriteIds(previousCache);
            console.error('Failed to toggle favorite:', error);
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, isLoading, isFavorite, toggleFavorite, refreshFavorites }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
