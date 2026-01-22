import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client';
import { venuesApi } from '../api/venues';
import { courtsApi } from '../api/courts';
import type { CourtRatings } from '../api/courts';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
// import { Card } from '../components/ui/Card';

// --- Types ---
interface Venue {
    id: string;
    court_name: string;
    location: string;
    game_type: string;
    prices: string;
    photos: string[];
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
// const IconFilter = () => (
//    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
// );

// --- Sub-Components ---

const VenueHero: React.FC<{
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    selectedCity: string;
    setSelectedCity: (c: string) => void;
    cities: string[];
}> = ({ searchTerm, setSearchTerm, selectedCity, setSelectedCity, cities }) => (
    <div className="relative pt-32 pb-20 px-6 bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/80 to-transparent z-10" />
            <img
                src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069"
                alt="Venues Hero"
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
            <motion.h1
                className="text-4xl md:text-6xl font-black text-white font-montserrat uppercase tracking-tight mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Find Your <span className="text-primary">Arena</span>
            </motion.h1>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">Discover and book the best sports venues in your city.</p>

            <motion.div
                className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-2 shadow-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex-1 bg-white/5 rounded-xl px-4 py-3 flex items-center gap-3 border border-transparent focus-within:border-primary/50 transition-colors">
                    <span className="text-gray-400"><IconSearch /></span>
                    <input
                        type="text"
                        placeholder="Search venues, sports..."
                        className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-full font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-64 bg-white/5 rounded-xl px-4 py-3 flex items-center gap-3 border border-transparent focus-within:border-primary/50 transition-colors relative">
                    <span className="text-primary"><IconMapPin /></span>
                    <select
                        className="bg-transparent border-none outline-none text-white w-full font-bold appearance-none cursor-pointer"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        {cities.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                    </select>
                    <div className="absolute right-4 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
                <Button variant="primary" className="py-3 px-6 rounded-xl whitespace-nowrap" onClick={() => { }}>
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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg font-montserrat uppercase">Filters</h3>
            <button className="text-xs font-bold text-gray-400 hover:text-primary transition-colors" onClick={() => {
                setSelectedSport('All');
                setSelectedBranch('All');
            }}>RESET</button>
        </div>

        <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Branch</label>
            <select
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
            >
                {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                        {branch.name}
                    </option>
                ))}
            </select>
        </div>

        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sport</label>
            <select
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
            >
                {sports.map(sport => (
                    <option key={sport} value={sport}>
                        {sport}
                    </option>
                ))}
            </select>
        </div>
    </div>
);

const VenueCard: React.FC<{ venue: Venue; onClick: () => void }> = ({ venue, onClick }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer flex flex-col h-full"
        onClick={onClick}
    >
        <div className="relative h-48 overflow-hidden">
            <img
                src={venue.photos?.[0] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070'}
                alt={venue.court_name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                {venue.game_type}
            </div>
            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-sm shadow-md hover:scale-110 transition-transform">
                ❤️
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-2 group-hover:translate-y-0 transition-transform">
                <p className="text-white text-xs font-bold flex items-center gap-1">
                    <span className="text-primary"><IconMapPin /></span> {venue.location}
                </p>
            </div>
        </div>

        <div className="p-5 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-primary transition-colors">{venue.court_name}</h3>
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                    <span className="text-yellow-500 text-xs">⭐</span>
                    <span className="text-xs font-bold text-gray-700">
                        {venue.rating ? venue.rating.toFixed(1) : '4.8'}
                        {venue.reviewCount && venue.reviewCount > 0 && (
                            <span className="text-gray-500 ml-1">({venue.reviewCount})</span>
                        )}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {venue.amenities?.slice(0, 3).map(a => (
                    <span key={a.id} className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{a.name}</span>
                )) || <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">Parking</span>}
                {venue.amenities && venue.amenities.length > 3 && (
                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">+{venue.amenities.length - 3}</span>
                )}
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                <div>
                    <span className="block text-xs text-gray-400 font-medium">Starting from</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-gray-900">₹{venue.prices}</span>
                        <span className="text-xs text-gray-500 font-medium">/hr</span>
                    </div>
                </div>
                <Button variant="secondary" size="sm" className="rounded-lg shadow-none" onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}>
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

    const [selectedCity, setSelectedCity] = useState('Hyderabad');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSport, setSelectedSport] = useState('All');
    const [selectedBranch, setSelectedBranch] = useState('All');

    const CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi'];
    const [sports, setSports] = useState<string[]>(['All']);
    const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([{ id: 'All', name: 'All' }]);

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
            const res = await apiClient.get(`/courts?city=${selectedCity}`);
            const venuesData = Array.isArray(res.data) ? res.data : [];

            // Fetch ratings for each venue
            const venuesWithRatings = await Promise.all(
                venuesData.map(async (venue: Venue) => {
                    try {
                        const ratingsRes = await courtsApi.getCourtRatings(venue.id);
                        return {
                            ...venue,
                            rating: ratingsRes.data.average_rating,
                            reviewCount: ratingsRes.data.total_reviews
                        };
                    } catch (error) {
                        console.error(`Failed to fetch ratings for venue ${venue.id}:`, error);
                        return venue; // Return venue without ratings if fetch fails
                    }
                })
            );

            setVenues(venuesWithRatings);
            setFilteredVenues(venuesWithRatings);
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
        <div className="min-h-screen bg-gray-50 font-inter">
            <TopNav />

            <VenueHero
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                cities={CITIES}
            />

            <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 shrink-0">
                    <FilterSidebar
                        selectedSport={selectedSport}
                        setSelectedSport={setSelectedSport}
                        sports={sports}
                        selectedBranch={selectedBranch}
                        setSelectedBranch={setSelectedBranch}
                        branches={branches}
                    />
                </aside>

                <main className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-gray-900 font-montserrat uppercase">{filteredVenues.length} Venues in {selectedCity}</h2>
                        <div className="flex gap-2">
                            {/* Add Sort Component if needed */}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="bg-white h-80 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No venues found</h3>
                            <p className="text-gray-500">Try adjusting your filters or search term.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
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
