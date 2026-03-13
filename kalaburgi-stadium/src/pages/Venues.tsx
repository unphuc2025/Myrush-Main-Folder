import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { venuesApi } from '../api/venues';
import type { Venue } from '../api/venues';
import { TopNav } from '../components/TopNav';
import { FaFutbol, FaHeart, FaRegHeart } from 'react-icons/fa';
import { useFavorites } from '../context/FavoritesContext';

// --- Icons ---
const IconSearch = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const CustomDropdown: React.FC<{
    label: string,
    value: string,
    options: string[] | { id: string, name: string }[],
    onChange: (val: string) => void
}> = ({ value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDisplayValue = () => {
        if (typeof options[0] === 'string') {
            return value;
        }
        const opt = (options as { id: string, name: string }[]).find(o => o.id === value);
        return opt ? opt.name : value;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border-4 border-black p-4 text-xs font-black uppercase tracking-widest text-black flex items-center justify-between cursor-pointer transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${isOpen ? 'bg-primary' : ''}`}
            >
                <span className="truncate">{getDisplayValue()}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-black"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-[110]"
                    >
                        <div className="max-h-60 overflow-y-auto">
                            {options.map((option) => {
                                const id = typeof option === 'string' ? option : option.id;
                                const name = typeof option === 'string' ? option : option.name;
                                return (
                                    <div
                                        key={id}
                                        onClick={() => {
                                            onChange(id);
                                            setIsOpen(false);
                                        }}
                                        className={`px-4 py-3 text-xs font-black uppercase tracking-widest cursor-pointer transition-colors border-b-2 border-black last:border-b-0 hover:bg-primary ${value === id ? 'bg-primary' : 'bg-white'}`}
                                    >
                                        {name}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Sub-Components ---
const VenueHero: React.FC<{
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    selectedCity: string;
    setSelectedCity: (c: string) => void;
    cities: string[];
}> = ({ searchTerm, setSearchTerm, selectedCity, setSelectedCity, cities }) => (
    <div className="relative pt-40 pb-20 px-6 bg-zinc-100 mb-16 overflow-hidden">
        {/* Background Image with Mesh Overlay */}
        <div className="absolute inset-0 z-0">
            <img 
                src="/images/venues-hero-sporty.png" 
                className="w-full h-full object-cover opacity-60"
                alt="Background"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-100 via-zinc-100/60 to-transparent" />
        </div>

        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/30 -skew-x-12 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-full h-8 bg-black" />
        
        <div className="relative z-10 container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 text-left">
                    <div className="inline-block bg-black text-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-[4px_4px_0px_0px_rgba(163,230,53,1)]">
                        Strategic Deployment
                    </div>
                    <motion.h1
                        className="text-6xl md:text-[8.5rem] font-black text-black font-heading mb-6 tracking-tighter italic leading-[0.75] drop-shadow-[0_4px_4px_rgba(255,255,255,0.8)]"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        FIND YOUR <br />
                        <span className="text-primary italic drop-shadow-[8px_8px_0px_black]">ARENA.</span>
                    </motion.h1>
                    <p className="text-black font-black text-xs uppercase tracking-[0.2em] mb-12 border-l-8 border-black pl-6">
                        Locate and occupy high-performance <br />
                        sporting zones across the territory.
                    </p>
                </div>

                <div className="relative flex-1">
                    <motion.div
                        className="w-full md:w-[500px] bg-white border-8 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="space-y-6">
                            <div className="relative">
                                <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <div className="w-1 h-3 bg-black" /> Target Zone
                                </div>
                                <div className="bg-zinc-100 border-4 border-black px-6 py-4 flex items-center gap-4 focus-within:bg-primary transition-colors">
                                    <span className="text-black"><IconSearch /></span>
                                    <input
                                        type="text"
                                        placeholder="SEARCH COORDINATES..."
                                        className="bg-transparent border-0 ring-0 outline-none focus:ring-0 focus:outline-none text-black placeholder-zinc-400 w-full font-black text-xs uppercase tracking-widest"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <div className="w-1 h-3 bg-black" /> Sector Selection
                                </div>
                                <CustomDropdown
                                    label="City"
                                    value={selectedCity}
                                    options={cities}
                                    onChange={setSelectedCity}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    </div>
);

const FilterSidebar: React.FC<{
    selectedSport: string;
    setSelectedSport: (s: string) => void;
    sports: string[];
    selectedBranch: string;
    setSelectedBranch: (b: string) => void;
    branches: Array<{ id: string; name: string }>;
}> = ({ selectedSport, setSelectedSport, sports, selectedBranch, setSelectedBranch, branches }) => (
    <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] sticky top-32">
        <div className="flex justify-between items-center mb-10 pb-4 border-b-4 border-black italic">
            <h3 className="text-2xl font-black font-heading text-black uppercase tracking-tighter">Tactical Filters</h3>
            <button
                className="text-[10px] font-black text-zinc-400 hover:text-red-600 transition-colors uppercase tracking-[0.2em]"
                onClick={() => {
                    setSelectedSport('All');
                    setSelectedBranch('All');
                }}
            >
                Reset
            </button>
        </div>

        <div className="space-y-10">
            <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-black mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary" /> Territory (Branch)
                </label>
                <CustomDropdown
                    label="Branch"
                    value={selectedBranch}
                    options={branches}
                    onChange={setSelectedBranch}
                />
            </div>

            <div>
                <label className="block text-[11px] font-black uppercase tracking-[0.3em] text-black mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary" /> Sport Discipline
                </label>
                <CustomDropdown
                    label="Sport"
                    value={selectedSport}
                    options={sports}
                    onChange={setSelectedSport}
                />
            </div>
        </div>
    </div>
);

const VenueCard: React.FC<{ venue: Venue; onClick: () => void }> = ({ venue, onClick }) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const favorited = isFavorite(venue.id) || (venue.branch_id ? isFavorite(venue.branch_id) : false);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await toggleFavorite(venue.id);
    };

    return (
        <div
            className="group bg-white overflow-hidden rounded-none border-4 border-black hover:shadow-[12px_12px_0px_0px_rgba(163,230,53,1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            onClick={onClick}
        >
            <div className="relative h-52 overflow-hidden border-b-4 border-black">
                <img
                    src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070'}
                    alt={venue.court_name}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-110"
                />

                {/* Favorite Button */}
                <button
                    onClick={handleToggleFavorite}
                    className={`absolute top-4 right-4 z-20 w-12 h-12 border-4 border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${favorited ? 'text-red-600' : 'text-black'}`}
                >
                    {favorited ? <FaHeart className="w-5 h-5" /> : <FaRegHeart className="w-5 h-5" />}
                </button>
            </div>

            <div className="p-5 flex flex-col flex-1 bg-white">
                {/* Title & Rating */}
                <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-xl font-black font-heading text-black uppercase tracking-tighter leading-none italic">
                        {venue.court_name}
                    </h3>
                    <div className="flex items-center gap-1 bg-black text-white px-3 py-1 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(163,230,53,1)]">
                        <span className="text-xs font-black">
                            {venue.rating && Number(venue.rating) > 0 ? Number(venue.rating).toFixed(1) : '5.0'}
                        </span>
                    </div>
                </div>

                {/* Price & CTA */}
                <div className="mt-auto pt-6 border-t-2 border-black/10 flex items-center justify-between gap-4">
                    <div>
                        <span className="block text-[7px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Operational Stake</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-black tracking-tighter italic">₹{venue.prices}</span>
                            <span className="text-[9px] text-zinc-500 font-black uppercase">/HR</span>
                        </div>
                    </div>
                    <button
                        className="bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] px-5 h-11 border-none hover:bg-primary hover:text-black transition-all shadow-[6px_6px_0px_0px_rgba(163,230,53,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                    >
                        Secure Venue
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---
export const Venues: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize selectedCity from localStorage or default to 'Hyderabad'
    const [selectedCity, setSelectedCity] = useState(() => {
        const savedCity = localStorage.getItem('selectedCity');
        return savedCity || 'Hyderabad';
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'All');
    const [selectedBranch, setSelectedBranch] = useState('All');

    const [cities, setCities] = useState<string[]>(['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi']);
    const [sports, setSports] = useState<string[]>(['All']);
    const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([{ id: 'All', name: 'All' }]);

    // Fetch available cities on mount
    useEffect(() => {
        const fetchCities = async () => {
            try {
                // Modified to fetch ALL active cities from dedicated endpoint
                const response = await venuesApi.getCities();
                if (response.success && response.data) {
                    const uniqueCities: string[] = response.data as string[]; // Already processed list of city names

                    if (uniqueCities.length > 0) {
                        setCities(uniqueCities);

                        const hasDetected = localStorage.getItem('locationDetected') === 'true';
                        if (!hasDetected) {
                            detectUserLocation(uniqueCities);
                        } else if (!uniqueCities.includes(selectedCity) && uniqueCities[0]) {
                            setSelectedCity(uniqueCities[0]);
                        }
                    } else {
                        // Fallback to default list if backend list is empty
                        detectUserLocation(['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi']);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch cities:", err);
            }
        };

        const detectUserLocation = async (availableCities: string[]) => {
            console.log("DEBUG: Attempting to detect user location. Available cities:", availableCities);
            if ("geolocation" in navigator) {
                console.log("DEBUG: Geolocation API available.");
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log(`DEBUG: Position found: ${latitude}, ${longitude}`);
                    try {
                        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                        console.log("DEBUG: Using Google Maps API Key:", apiKey ? "Found" : "NOT FOUND");

                        if (!apiKey) throw new Error("Google Maps API Key missing in .env");

                        const geoResp = await fetch(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                        );
                        const geoData = await geoResp.json();
                        console.log("DEBUG: GeoData from Google Maps:", geoData);

                        // Extract city from Google Maps results (usually 'locality' or 'administrative_area_level_2')
                        let detectedCity = '';
                        const result = geoData.results[0];
                        if (result) {
                            const cityComp = result.address_components.find((c: any) =>
                                c.types.includes('locality') ||
                                c.types.includes('administrative_area_level_2')
                            );
                            detectedCity = cityComp?.long_name || '';
                        }

                        console.log("DEBUG: Extracted city name:", detectedCity);

                        if (detectedCity) {
                            // Find matching city in our available cities (case-insensitive)
                            const matchedCity = availableCities.find(
                                c => c.toLowerCase().includes(detectedCity.toLowerCase()) ||
                                    detectedCity.toLowerCase().includes(c.toLowerCase())
                            );

                            console.log("DEBUG: Matched city in our list:", matchedCity);

                            if (matchedCity) {
                                setSelectedCity(matchedCity);
                                localStorage.setItem('locationDetected', 'true');
                                console.log("DEBUG: Automatically selected city:", matchedCity);
                            } else {
                                console.log("DEBUG: No matching city found in availableCities.");
                            }
                        }
                    } catch (error) {
                        console.error("DEBUG: Error in reverse geocoding:", error);
                    }
                }, (error) => {
                    console.warn("DEBUG: Geolocation permission denied or error:", error);
                });
            } else {
                console.log("DEBUG: Geolocation API NOT available in this browser.");
            }
        };

        fetchCities();
    }, []);

    // Save selectedCity to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('selectedCity', selectedCity);
    }, [selectedCity]);

    useEffect(() => {
        fetchVenues();
        fetchGameTypes();
    }, [selectedCity]);

    useEffect(() => {
        fetchBranches();
    }, [selectedCity]);

    const displayedSports = React.useMemo(() => {
        if (selectedBranch === 'All') return sports;

        const branchName = branches.find(b => b.id === selectedBranch)?.name;
        if (!branchName) return sports;

        const available = new Set<string>();
        venues.filter(v => v.branch_name === branchName).forEach(v => {
            if (v.game_type) {
                v.game_type.split(',').forEach(s => available.add(s.trim()));
            }
        });

        return sports.filter(s => s === 'All' || available.has(s));
    }, [sports, venues, selectedBranch, branches]);

    useEffect(() => {
        if (selectedSport !== 'All' && !displayedSports.includes(selectedSport)) {
            setSelectedSport('All');
        }
    }, [displayedSports, selectedSport]);

    useEffect(() => {
        let res = venues;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            res = res.filter(v =>
                v.court_name.toLowerCase().includes(term) ||
                v.location.toLowerCase().includes(term)
            );
        }
        if (selectedBranch !== 'All') {
            res = res.filter(v => v.branch_name === branches.find(b => b.id === selectedBranch)?.name);
        }
        if (selectedSport !== 'All') {
            res = res.filter(v => v.game_type.includes(selectedSport));
        }
        setFilteredVenues(res);
    }, [venues, searchTerm, selectedSport, selectedBranch, branches]);

    const fetchVenues = async () => {
        setLoading(true);
        try {
            // Updated to fetch Venues (Branches) instead of Courts
            // Using the API service abstraction which now points to /venues
            const response = await venuesApi.getVenues({ city: selectedCity });

            if (response.success && Array.isArray(response.data)) {
                // Map API response to local Venue interface to fix type mismatch
                const mappedVenues: Venue[] = response.data.map((v: any) => ({
                    id: v.id,
                    court_name: v.court_name,
                    location: v.location,
                    game_type: v.game_type,
                    prices: v.prices,
                    photos: v.photos || [],
                    description: v.description || '',
                    branch_name: v.branch_name,
                    branch_id: v.branch_id || v.id, // Explicitly set branch_id
                    amenities: v.amenities,
                    rating: v.rating || 0,
                    reviews: v.reviews || 0
                }));
                setVenues(mappedVenues);
                setFilteredVenues(mappedVenues);
            } else {
                console.error('Failed to fetch venues:', response.error);
                setVenues([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchGameTypes = async () => {
        const response = await venuesApi.getGameTypes();
        if (response.success && response.data) {
            setSports(['All', ...response.data]);
        }
    };

    const fetchBranches = async () => {
        const response = await venuesApi.getBranches(selectedCity);
        if (response.success && response.data) {
            setBranches([{ id: 'All', name: 'All' }, ...response.data.map(b => ({ id: b.id, name: b.name }))]);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 font-sans text-gray-900 relative">
            <TopNav />

            <VenueHero
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                cities={cities}
            />

            <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-8 relative z-10 pb-32">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-[-1] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                {/* Sidebar */}
                <aside className="w-full lg:w-[350px] shrink-0">
                    <FilterSidebar
                        selectedSport={selectedSport}
                        setSelectedSport={setSelectedSport}
                        sports={displayedSports}
                        selectedBranch={selectedBranch}
                        setSelectedBranch={setSelectedBranch}
                        branches={branches}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Header with Depth Effect */}
                    <div className="mb-20 relative">
                        <div className="absolute -top-16 -left-8 text-[12rem] font-black text-zinc-200/50 pointer-events-none uppercase tracking-tighter italic select-none hidden xl:block">
                            ARENAS
                        </div>
                        <h2 className="relative z-10 text-4xl md:text-6xl font-black font-heading text-black uppercase tracking-tighter italic leading-[0.85]">
                            {filteredVenues.length} ACTIVE <br />
                            <span className="text-primary drop-shadow-[5px_5px_0px_black]">ARENAS</span> <span className="text-zinc-400">IN {selectedCity}</span>
                        </h2>
                        <div className="w-32 h-4 bg-black mt-8" />
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="bg-white h-[500px] border-4 border-black border-dashed animate-pulse shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]" />
                            ))}
                        </div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="text-center py-32 bg-white border-4 border-black border-dashed shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)]">
                            <h3 className="text-4xl font-black font-heading text-black uppercase italic mb-4 pt-10">Zero Intel Found</h3>
                            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-10">No venues match your current tactical parameters.</p>
                            <button
                                className="bg-black text-white px-10 py-4 font-black uppercase tracking-widest border-none hover:bg-primary hover:text-black transition-all shadow-[8px_8px_0px_0px_rgba(163,230,53,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedSport('All');
                                    setSelectedBranch('All');
                                }}
                            >
                                Clear All Parameters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {filteredVenues.map(venue => (
                                <VenueCard
                                    key={venue.id}
                                    venue={venue}
                                    onClick={() => navigate(`/venues/${venue.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
