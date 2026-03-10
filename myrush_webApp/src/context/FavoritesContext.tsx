import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

    // Set of favorited IDs — includes court IDs (from API) + all original venue/branch IDs
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    // Persistent map: venueId (branch ID) -> courtId
    // This is built up over time as users toggle favorites and survives refreshes
    const venueToCourtMapRef = useRef<Map<string, string>>(new Map());

    const { user } = useAuth();

    /**
     * After a refresh, reconstruct the full favoriteIds set by:
     * 1. Including all courtIds from the API response
     * 2. Also including all venueIds (branch IDs) whose court is in the response
     */
    const buildFavoriteIds = useCallback((courtFavorites: Venue[]): Set<string> => {
        const ids = new Set<string>(courtFavorites.map((fav: Venue) => fav.id));
        // Re-add branch IDs for any venue whose mapped court is still favorited
        venueToCourtMapRef.current.forEach((courtId, venueId) => {
            if (ids.has(courtId)) {
                ids.add(venueId);
            }
        });
        return ids;
    }, []);

    const refreshFavorites = useCallback(async () => {
        if (!user) {
            setFavorites([]);
            setFavoriteIds(new Set());
            return;
        }

        try {
            setIsLoading(true);
            const response = await favoritesApi.getFavorites();
            if (response.success && Array.isArray(response.data)) {
                setFavorites(response.data);
                setFavoriteIds(buildFavoriteIds(response.data));
            }
        } catch (error) {
            console.error('Failed to fetch favorites:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, buildFavoriteIds]);

    useEffect(() => {
        refreshFavorites();
    }, [refreshFavorites]);

    const isFavorite = useCallback((venueId: string) => {
        return favoriteIds.has(venueId);
    }, [favoriteIds]);

    const toggleFavorite = async (venueId: string) => {
        if (!user) {
            alert('Please login to add favorites');
            return;
        }

        const isCurrentlyFavorite = favoriteIds.has(venueId);
        const previousIds = new Set(favoriteIds);
        const previousFavorites = [...favorites];

        // --- Optimistic update ---
        if (isCurrentlyFavorite) {
            setFavoriteIds(prev => {
                const next = new Set(prev);
                next.delete(venueId);
                // Also remove any court ID mapped from this venue
                const courtId = venueToCourtMapRef.current.get(venueId);
                if (courtId) next.delete(courtId);
                return next;
            });
            setFavorites(prev => prev.filter(fav => fav.id !== venueId && fav.id !== venueToCourtMapRef.current.get(venueId)));
        } else {
            setFavoriteIds(prev => {
                const next = new Set(prev);
                next.add(venueId);
                return next;
            });
            const placeholder: any = { id: venueId, court_name: 'Loading...' };
            setFavorites(prev => [...prev, placeholder]);
        }

        try {
            const response = await favoritesApi.toggleFavorite(venueId);
            if (response.success) {
                // Save the venueId -> courtId mapping from the toggle response
                if (!isCurrentlyFavorite && response.data?.court_id) {
                    venueToCourtMapRef.current.set(venueId, response.data.court_id);
                } else if (isCurrentlyFavorite) {
                    venueToCourtMapRef.current.delete(venueId);
                }

                // Refresh from server to get full, correct data
                await refreshFavorites();
            } else {
                setFavoriteIds(previousIds);
                setFavorites(previousFavorites);
                console.error('Failed to toggle favorite:', response.error);
            }
        } catch (error) {
            setFavoriteIds(previousIds);
            setFavorites(previousFavorites);
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
