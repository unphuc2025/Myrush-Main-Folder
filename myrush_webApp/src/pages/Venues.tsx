import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol, FaBasketballBall, FaVolleyballBall } from 'react-icons/fa';
import { GiCricketBat, GiShuttlecock, GiTennisRacket } from 'react-icons/gi';
import { venuesApi } from '../api/venues';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
interface Venue {
    id: string;
    court_name: string;
    location: string;
    game_type: string;
    prices: string;
    photos?: string[];
    description: string;
    branch_name?: string;
    amenities?: Array<{
        id: string;
        name: string;
        description?: string;
        icon?: string;
        icon_url?: string;
    }>;
    rating?: number;
    reviewCount?: number;
}

// --- Icons ---
const IconSearch = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const IconMapPin = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const getSportIcon = (sport: string) => {
    const s = sport.toLowerCase();
    if (s.includes('cricket')) return <GiCricketBat className="w-4 h-4" />;
    if (s.includes('badminton')) return <GiShuttlecock className="w-4 h-4" />;
    if (s.includes('football') || s.includes('soccer')) return <FaFutbol className="w-4 h-4" />;
    if (s.includes('tennis')) return <GiTennisRacket className="w-4 h-4" />;
    if (s.includes('basketball')) return <FaBasketballBall className="w-4 h-4" />;
    if (s.includes('volleyball')) return <FaVolleyballBall className="w-4 h-4" />;
    return <span className="text-[10px] font-bold">{sport.substring(0, 2)}</span>;
};

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
                className={`w-full bg-white border-2 rounded-xl p-3.5 text-sm font-semibold text-gray-700 flex items-center justify-between cursor-pointer transition-all hover:border-gray-300 ${isOpen ? 'border-primary' : 'border-gray-100'}`}
            >
                <span className="truncate">{getDisplayValue()}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-gray-400 group-hover:text-primary transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-[110]"
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
                                        className={`px-4 py-3 text-sm font-semibold cursor-pointer transition-colors hover:bg-primary/5 ${value === id ? 'text-primary bg-primary/5' : 'text-gray-700'}`}
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
    <div className="relative pt-32 pb-20 px-6 bg-black overflow-hidden mb-12">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black to-black z-10" />
            <img
                src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069"
                alt="Venues Hero"
                className="w-full h-full object-cover opacity-50"
            />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
            <motion.h1
                className="text-4xl md:text-6xl font-black text-white font-heading uppercase tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">Arena</span>
            </motion.h1>
            <p className="text-white font-medium text-lg mb-8 max-w-2xl mx-auto drop-shadow-md">Discover and book the best sports venues in your city.</p>

            <motion.div
                className="bg-white p-2 rounded-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-2 shadow-xl border border-gray-100"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border-2 border-transparent focus-within:border-primary transition-all">
                    <span className="text-gray-400"><IconSearch /></span>
                    <input
                        type="text"
                        placeholder="Search venues..."
                        className="bg-transparent border-0 ring-0 outline-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400 w-full font-medium text-sm md:text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64 bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 border-2 border-gray-100 hover:border-primary/30 focus-within:border-primary transition-all relative group cursor-pointer shadow-sm">
                    <span className="text-primary pointer-events-none"><IconMapPin /></span>
                    <select
                        className="bg-transparent absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        {cities.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                    </select>
                    <span className="flex-1 text-center font-bold text-gray-900 uppercase tracking-wide font-heading select-none">
                        {selectedCity}
                    </span>
                    <div className="pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                <Button variant="primary" className="py-3 px-6 rounded-xl whitespace-nowrap font-bold uppercase tracking-widest shadow-glow hover:shadow-glow-strong" onClick={() => { }}>
                    Search
                </Button>
            </motion.div>
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
    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 sticky top-24">
        <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-lg font-heading uppercase text-gray-900 tracking-wide">Filters</h3>
            <button
                className="text-xs font-bold text-gray-400 hover:text-primary transition-colors tracking-widest uppercase"
                onClick={() => {
                    setSelectedSport('All');
                    setSelectedBranch('All');
                }}
            >
                Reset
            </button>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-3">Branch</label>
                <CustomDropdown
                    label="Branch"
                    value={selectedBranch}
                    options={branches}
                    onChange={setSelectedBranch}
                />
            </div>

            <div>
                <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-3">Sport</label>
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

const VenueCard: React.FC<{ venue: Venue; onClick: () => void }> = ({ venue, onClick }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group bg-white overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl active:shadow-sm active:scale-[0.98] transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100 hover:border-primary/20 active:border-primary/50"
        onClick={onClick}
    >
        <div className="relative h-56 overflow-hidden">
            <img
                src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070'}
                alt={venue.court_name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Sport Tag */}
            <div className="absolute top-4 left-4">
                <div className="flex gap-1.5 bg-white/95 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-full shadow-sm border border-white/50">
                    {venue.game_type.split(',').map((sport, i) => (
                        <div key={i} title={sport.trim()} className="text-gray-800">
                            {getSportIcon(sport.trim())}
                        </div>
                    ))}
                </div>
            </div>

            {/* Location Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 pt-12 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-xs font-bold flex items-center gap-2 drop-shadow-md">
                    <span className="text-primary bg-primary/20 p-1 rounded-full"><IconMapPin /></span>
                    <span className="truncate opacity-90">{venue.location}</span>
                </p>
            </div>
        </div>

        <div className="p-6 flex flex-col flex-1 bg-white relative z-10">
            {/* Title & Rating */}
            <div className="flex justify-between items-start mb-4 gap-4">
                <h3 className="font-semibold text-lg text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {venue.court_name}
                </h3>
                <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20 shrink-0">
                    <span className="text-yellow-500 text-xs">⭐</span>
                    <span className="text-xs font-bold text-gray-900">
                        {venue.rating ? Number(venue.rating).toFixed(1) : '0'}
                    </span>
                </div>
            </div>

            {/* Price & CTA */}
            <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                <div>
                    <span className="block text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Starting from</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-gray-900 tracking-tight">₹{venue.prices}</span>
                        <span className="text-xs text-gray-500 font-medium">/hr</span>
                    </div>
                </div>
                <button
                    className="bg-zinc-900 text-white hover:bg-primary hover:text-black font-semibold text-sm px-6 py-3 rounded-lg shadow-lg hover:shadow-primary/30 transition-all duration-300 whitespace-nowrap shrink-0 active:scale-95"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                >
                    Book Now
                </button>
            </div>
        </div>
    </motion.div>
);

// --- Main Page ---
export const Venues: React.FC = () => {
    const navigate = useNavigate();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize selectedCity from localStorage or default to 'Hyderabad'
    const [selectedCity, setSelectedCity] = useState(() => {
        const savedCity = localStorage.getItem('selectedCity');
        return savedCity || 'Hyderabad';
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSport, setSelectedSport] = useState('All');
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

    useEffect(() => {
        let res = venues;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            res = res.filter(v =>
                v.court_name.toLowerCase().includes(term) ||
                v.location.toLowerCase().includes(term)
            );
        }
        if (selectedSport !== 'All') {
            res = res.filter(v => v.game_type.includes(selectedSport));
        }
        if (selectedBranch !== 'All') {
            res = res.filter(v => v.branch_name === branches.find(b => b.id === selectedBranch)?.name);
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
                    amenities: v.amenities,
                    rating: v.rating || 0,
                    reviewCount: v.reviews || 0
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
        <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 relative">
            {/* Mesh Background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-400/20 blur-[100px] animate-pulse delay-700"></div>
            </div>

            <TopNav />

            <VenueHero
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                cities={cities}
            />

            <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pb-20 flex flex-col lg:flex-row gap-8 md:gap-12 relative z-10">
                {/* Sidebar - Horizontal on Mobile, Sidebar on Desktop */}
                <aside className="w-full lg:w-72 shrink-0">
                    <div className="lg:block">
                        <FilterSidebar
                            selectedSport={selectedSport}
                            setSelectedSport={setSelectedSport}
                            sports={sports}
                            selectedBranch={selectedBranch}
                            setSelectedBranch={setSelectedBranch}
                            branches={branches}
                        />
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col gap-6 mb-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <h2 className="text-3xl font-black text-gray-900 font-heading uppercase tracking-tight">
                                {filteredVenues.length} Venues in
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500 ml-2">
                                    {selectedCity}
                                </span>
                            </h2>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(n => (
                                <div key={n} className="bg-white h-[400px] animate-pulse shadow-sm border border-gray-100" />
                            ))}
                        </div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="text-center py-24 bg-white/50 backdrop-blur-sm border border-dashed border-gray-200">
                            <div className="text-6xl mb-6 opacity-20">🏟️</div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase font-heading">No venues found</h3>
                            <p className="text-gray-500 font-medium">Try adjusting your filters or search for something else.</p>
                            <Button
                                className="mt-6 text-primary font-bold hover:underline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedSport('All');
                                    setSelectedBranch('All');
                                }}
                            >
                                Clear all filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            <AnimatePresence mode='popLayout'>
                                {filteredVenues.map(venue => (
                                    <VenueCard
                                        key={venue.id}
                                        venue={venue}
                                        onClick={() => navigate(`/venues/${venue.id}`)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
