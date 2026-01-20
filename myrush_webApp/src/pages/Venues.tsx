import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../api/client';
import { venuesApi } from '../api/venues';
import { TopNav } from '../components/TopNav';
import './Venues.css';

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
    amenities?: string[];
    rating?: number; // Optional
}

// --- Icons ---
const IconSearch = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);
const IconMapPin = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
    </svg>
);
const IconFilter = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

// --- Sub-Components ---

const VenueHero: React.FC<{
    searchTerm: string;
    setSearchTerm: (s: string) => void;
    selectedCity: string;
    setSelectedCity: (c: string) => void;
    cities: string[];
}> = ({ searchTerm, setSearchTerm, selectedCity, setSelectedCity, cities }) => (
    <div className="venues-hero-modern">
        <div className="hero-overlay-modern"></div>
        <div className="hero-content-modern">
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Find Your Perfect Court
            </motion.h1>
            <p className="hero-subtitle">Book top-rated sports venues near you instantly.</p>

            <motion.div
                className="search-bar-modern"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="search-input-wrapper">
                    <IconSearch />
                    <input
                        type="text"
                        placeholder="Search venues, sports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="divider-modern"></div>
                <div className="location-select-wrapper">
                    <IconMapPin />
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <button className="search-btn-modern">Search</button>
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
    <div className="filters-sidebar-modern">
        <div className="filter-header">
            <h3>Filters</h3>
            <button className="clear-btn">Clear all</button>
        </div>

        <div className="filter-group-modern">
            <label>Sports</label>
            <select
                className="filter-select"
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

        <div className="filter-group-modern">
            <label>Branches</label>
            <select
                className="filter-select"
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
    </div>
);

const VenueCard: React.FC<{ venue: Venue; onClick: () => void }> = ({ venue, onClick }) => (
    <motion.div
        className="venue-card-modern"
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClick}
    >
        <div className="card-image-container">
            <img
                src={venue.photos?.[0] || '/court-placeholder.png'}
                alt={venue.court_name}
                loading="lazy"
            />
            <div className="card-badge">{venue.game_type}</div>
            <button className="card-fav-btn">❤️</button>
        </div>
        <div className="card-details">
            <div className="card-header-row">
                <h3>{venue.court_name}</h3>
                <div className="card-rating">⭐ {venue.rating || '4.5'}</div>
            </div>
            <p className="card-location">📍 {venue.location}</p>

            <div className="card-amenities-row">
                {venue.amenities?.slice(0, 3).map(a => (
                    <span key={a} className="mini-tag">{a}</span>
                ))}
            </div>

            <div className="card-footer-row">
                <div className="price-block">
                    <span className="price-val">₹{venue.prices}</span>
                    <span className="price-unit">/hr</span>
                </div>
                <button className="book-btn-sm">Book</button>
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
            setVenues(Array.isArray(res.data) ? res.data : []); // Safety check
            setFilteredVenues(Array.isArray(res.data) ? res.data : []);
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
        <div className="venues-page-modern">
            <TopNav />

            <VenueHero
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                cities={CITIES}
            />

            <div className="venues-layout-container">
                <aside className="sidebar-area">
                    <FilterSidebar
                        selectedSport={selectedSport}
                        setSelectedSport={setSelectedSport}
                        sports={sports}
                        selectedBranch={selectedBranch}
                        setSelectedBranch={setSelectedBranch}
                        branches={branches}
                    />
                </aside>

                <main className="results-area">
                    <div className="results-header">
                        <h2>{filteredVenues.length} Venues in {selectedCity}</h2>
                        <div className="sort-toggles">
                            <button className="sort-btn-modern"><IconFilter /> Sort</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loader-modern"></div>
                    ) : filteredVenues.length === 0 ? (
                        <div className="empty-modern">No venues found matching your criteria.</div>
                    ) : (
                        <div className="cards-grid-modern">
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
