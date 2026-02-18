import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { venuesApi } from '../api/venues';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaFutbol, FaBasketballBall, FaVolleyballBall } from 'react-icons/fa';
import { GiCricketBat, GiShuttlecock, GiTennisRacket, GiTennisBall } from 'react-icons/gi';
import { MdSportsCricket, MdSportsSoccer, MdSportsTennis } from 'react-icons/md';
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
                className="text-4xl md:text-6xl font-black text-white font-montserrat uppercase tracking-tight mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-transparent focus-within:border-primary/50 transition-colors">
                    <span className="text-gray-400"><IconSearch /></span>
                    <input
                        type="text"
                        placeholder="Search venues, sports..."
                        className="bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-full font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64 bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3 border border-gray-100 hover:border-primary/50 focus-within:border-primary/50 transition-all relative group cursor-pointer shadow-sm">
                    <span className="text-primary pointer-events-none"><IconMapPin /></span>
                    <select
                        className="bg-transparent absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        {cities.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                    </select>
                    <span className="flex-1 text-center font-bold text-gray-900 uppercase tracking-wide font-montserrat select-none">
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
            <h3 className="font-bold text-lg font-montserrat uppercase text-gray-900 tracking-wide">Filters</h3>
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
                <div className="relative group">
                    <select
                        className="w-full bg-white border-2 border-gray-100 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer hover:border-gray-300"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-3">Sport</label>
                <div className="relative group">
                    <select
                        className="w-full bg-white border-2 border-gray-100 rounded-xl p-3.5 text-sm font-semibold text-gray-700 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer hover:border-gray-300"
                        value={selectedSport}
                        onChange={(e) => setSelectedSport(e.target.value)}
                    >
                        {sports.map(sport => (
                            <option key={sport} value={sport}>
                                {sport}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
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
        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full border border-gray-100 hover:border-primary/20"
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
            {/* Heart Icon */}
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-sm shadow-sm hover:bg-white transition-all hover:scale-110 border border-white/50 group/heart">
                <span className="text-gray-400 group-hover/heart:text-red-500 transition-colors text-lg">♥</span>
            </button>
            {/* Location Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent p-5 pt-12 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
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
            <div className="mt-auto pt-6 border-t border-gray-100 flex items-end justify-between gap-4">
                <div>
                    <span className="block text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">Starting from</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-gray-900 tracking-tight">₹{venue.prices}</span>
                        <span className="text-xs text-gray-500 font-medium">/hr</span>
                    </div>
                </div>
                <Button
                    className="bg-zinc-900 text-white hover:bg-primary hover:text-black font-semibold text-sm px-6 py-2.5 rounded-lg shadow-lg hover:shadow-primary/30 transition-all duration-300"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                >
                    Book
                </Button>
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

    const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi'];
    const [sports, setSports] = useState<string[]>(['All']);
    const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([{ id: 'All', name: 'All' }]);

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
            res = res.filter(v => v.game_type === selectedSport);
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
                    rating: 0,
                    reviewCount: 0
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
        <div className="min-h-screen bg-gray-50/50 font-inter text-gray-900 relative">
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
                cities={CITIES}
            />

            <div className="max-w-7xl mx-auto px-6 pb-20 flex flex-col lg:flex-row gap-12 relative z-10">
                {/* Sidebar */}
                <aside className="w-full lg:w-72 shrink-0">
                    <FilterSidebar
                        selectedSport={selectedSport}
                        setSelectedSport={setSelectedSport}
                        sports={sports}
                        selectedBranch={selectedBranch}
                        setSelectedBranch={setSelectedBranch}
                        branches={branches}
                    />
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-col gap-6 mb-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <h2 className="text-3xl font-black text-gray-900 font-montserrat uppercase tracking-tight">
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
                                <div key={n} className="bg-white h-[400px] rounded-3xl animate-pulse shadow-sm border border-gray-100" />
                            ))}
                        </div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-200">
                            <div className="text-6xl mb-6 opacity-20">🏟️</div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase font-montserrat">No venues found</h3>
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
