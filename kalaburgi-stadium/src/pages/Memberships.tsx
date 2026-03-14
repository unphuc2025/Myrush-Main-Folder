import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { 
    FaSearch, 
    FaSwimmingPool, 
    FaRunning, 
    FaBasketballBall, 
    FaFutbol, 
    FaDumbbell, 
    FaUserGraduate, 
    FaGem,
    FaInfoCircle,
    FaStar,
    FaMapMarkerAlt,
    FaTimes,
    FaChevronRight,
    FaCheckCircle,
    FaIdCard
} from 'react-icons/fa';

interface FeeTier {
    monthly: number | string;
    yearly: number | string;
}

interface SportFee {
    name: string;
    daily: number | string;
    regular: FeeTier;
    discounted: FeeTier; // 50% for Students/Seniors
    premium: FeeTier;    // 150% for Equipment/Coach
    category: string;
}

export const Memberships: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'regular' | 'discounted' | 'premium'>('regular');
    const [selectedSport, setSelectedSport] = useState<SportFee | null>(null);
    const [checkoutStep, setCheckoutStep] = useState(0); // 0: none, 1: selection, 2: details, 3: success
    const navigate = useNavigate();

    const fees: SportFee[] = [
        { name: 'Swimming', daily: 100, regular: { monthly: 1200, yearly: 12000 }, discounted: { monthly: 600, yearly: 6000 }, premium: { monthly: 1800, yearly: 18000 }, category: 'Aquatics' },
        { name: 'Tennis', daily: 40, regular: { monthly: 700, yearly: 7000 }, discounted: { monthly: 400, yearly: 4000 }, premium: { monthly: 1200, yearly: 12000 }, category: 'Court' },
        { name: 'Squash', daily: 30, regular: { monthly: 600, yearly: 6000 }, discounted: { monthly: 300, yearly: 3000 }, premium: { monthly: 900, yearly: 9000 }, category: 'Court' },
        { name: 'Gym (Male)', daily: 30, regular: { monthly: 600, yearly: 6000 }, discounted: { monthly: 400, yearly: 4000 }, premium: { monthly: 900, yearly: 9000 }, category: 'Fitness' },
        { name: 'Gym (Female)', daily: 20, regular: { monthly: 400, yearly: 4000 }, discounted: { monthly: 200, yearly: 2000 }, premium: { monthly: 900, yearly: 9000 }, category: 'Fitness' },
        { name: 'Badminton', daily: 50, regular: { monthly: 500, yearly: 5000 }, discounted: { monthly: 400, yearly: 4000 }, premium: { monthly: 1000, yearly: 10000 }, category: 'Court' },
        { name: 'Table Tennis', daily: 25, regular: { monthly: 500, yearly: 5000 }, discounted: { monthly: 400, yearly: 4000 }, premium: { monthly: 900, yearly: 9000 }, category: 'Indoor' },
        { name: 'Athletics', daily: 30, regular: { monthly: 600, yearly: 6000 }, discounted: { monthly: 300, yearly: 3000 }, premium: { monthly: 900, yearly: 9000 }, category: 'Track' },
        { name: 'Hockey', daily: 10, regular: { monthly: 100, yearly: 1000 }, discounted: { monthly: 50, yearly: 500 }, premium: { monthly: 200, yearly: 2000 }, category: 'Field' },
        { name: 'Basketball', daily: 15, regular: { monthly: 300, yearly: 3000 }, discounted: { monthly: 200, yearly: 2000 }, premium: { monthly: 500, yearly: 5000 }, category: 'Court' },
        { name: 'Football', daily: 10, regular: { monthly: 200, yearly: 2000 }, discounted: { monthly: 100, yearly: 1000 }, premium: { monthly: 400, yearly: 4000 }, category: 'Field' },
        { name: 'Cricket', daily: 10, regular: { monthly: 200, yearly: 2000 }, discounted: { monthly: 100, yearly: 1000 }, premium: { monthly: 400, yearly: 4000 }, category: 'Field' },
        { name: 'Handball', daily: 10, regular: { monthly: 200, yearly: 2000 }, discounted: { monthly: 100, yearly: 1000 }, premium: { monthly: 400, yearly: 4000 }, category: 'Field' },
        { name: 'Volleyball', daily: 20, regular: { monthly: 300, yearly: 3000 }, discounted: { monthly: 200, yearly: 2000 }, premium: { monthly: 600, yearly: 6000 }, category: 'Court' },
        { name: 'Kabaddi', daily: 10, regular: { monthly: 100, yearly: 1000 }, discounted: { monthly: 50, yearly: 500 }, premium: { monthly: 200, yearly: 2000 }, category: 'Field' },
        { name: 'Kho Kho', daily: 10, regular: { monthly: 100, yearly: 1000 }, discounted: { monthly: 50, yearly: 500 }, premium: { monthly: 200, yearly: 2000 }, category: 'Field' },
        { name: 'Judo', daily: 10, regular: { monthly: 100, yearly: 1000 }, discounted: { monthly: 50, yearly: 500 }, premium: { monthly: 200, yearly: 2000 }, category: 'Indoor' },
        { name: 'Skating', daily: 15, regular: { monthly: 300, yearly: 3000 }, discounted: { monthly: '-', yearly: '-' }, premium: { monthly: '-', yearly: '-' }, category: 'Track' },
        { name: 'Wellness Center', daily: 100, regular: { monthly: 1200, yearly: 12000 }, discounted: { monthly: 600, yearly: 6000 }, premium: { monthly: '-', yearly: '-' }, category: 'Fitness' },
        { name: 'Walking', daily: 5, regular: { monthly: 100, yearly: 500 }, discounted: { monthly: '-', yearly: '-' }, premium: { monthly: '-', yearly: '-' }, category: 'Track' },
        { name: 'ID Card (One Time)', daily: 50, regular: { monthly: 50, yearly: 50 }, discounted: { monthly: 50, yearly: 50 }, premium: { monthly: 50, yearly: 50 }, category: 'Admin' },
    ];

    const filteredFees = fees.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const getIcon = (cat: string) => {
        switch(cat) {
            case 'Aquatics': return <FaSwimmingPool />;
            case 'Court': return <FaBasketballBall />;
            case 'Fitness': return <FaDumbbell />;
            case 'Field': return <FaFutbol />;
            case 'Track': return <FaRunning />;
            default: return <FaInfoCircle />;
        }
    };

    const startBooking = (fee: SportFee) => {
        setSelectedSport(fee);
        setCheckoutStep(1);
    };

    const closeBooking = () => {
        setSelectedSport(null);
        setCheckoutStep(0);
    };

    return (
        <div className="min-h-screen bg-white text-black selection:bg-primary selection:text-black">
            <TopNav />

            {/* Header section */}
            <section className="pt-32 pb-16 bg-slate-50 border-b-8 border-black">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div>
                            <span className="bg-primary text-black px-4 py-1 font-black uppercase tracking-widest text-xs skew-x-[-15deg] mb-4 inline-block">
                                <span className="inline-block skew-x-[15deg]">Official District Fees</span>
                            </span>
                            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none italic">
                                Association <br /> <span className="text-primary">Membership.</span>
                            </h1>
                        </div>
                        <div className="md:text-right">
                            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs max-w-sm mb-4 border-r-4 border-black pr-4">
                                Unified Fees Structure (Annexure-1) for Association Managed Venues.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-end">
                                <button className="px-4 py-2 border-2 border-black font-black text-[10px] uppercase hover:bg-black hover:text-white transition-all">Download PDF</button>
                                <button className="px-4 py-2 bg-black text-white font-black text-[10px] uppercase border-2 border-black">View Bylaws</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Controls Section */}
            <section className="sticky top-20 z-40 bg-white border-b-4 border-black py-6">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center">
                        {/* Search */}
                        <div className="relative group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search Sport..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-black rounded-none font-black uppercase tracking-widest focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all outline-none"
                            />
                        </div>

                        {/* Tiers Toggle */}
                        <div className="lg:col-span-2 flex flex-wrap gap-2">
                            {[
                                { id: 'regular', label: 'Regular Fees', icon: <FaGem /> },
                                { id: 'discounted', label: '50% Discount*', icon: <FaUserGraduate /> },
                                { id: 'premium', label: '150% + Coach/Eq', icon: <FaStar /> },
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => setViewMode(btn.id as any)}
                                    className={`flex-1 min-w-[150px] flex items-center justify-center gap-3 py-4 border-2 border-black font-black uppercase tracking-tight transition-all text-xs
                                        ${viewMode === btn.id ? 'bg-primary text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    {btn.icon} {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {viewMode === 'discounted' && (
                        <p className="mt-4 text-[10px] font-black uppercase text-zinc-500 tracking-widest border-l-4 border-primary pl-4">
                            * Eligible for Students Under 16, Senior Citizens (Above 60), Govt Employees, and National/State Level Sportspersons.
                        </p>
                    )}
                </div>
            </section>

            {/* Fees Table/Grid */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-6">
                    {/* Desktop Table View */}
                    <div className="hidden lg:block border-4 border-black overflow-hidden bg-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.05)]">
                        <table className="w-full text-left">
                            <thead className="bg-black text-white font-black uppercase text-xs tracking-[0.2em]">
                                <tr>
                                    <th className="p-6 border-r border-zinc-800">Sport / Service</th>
                                    <th className="p-6 border-r border-zinc-800">Daily (1Hr)</th>
                                    <th className="p-6 border-r border-zinc-800">Monthly</th>
                                    <th className="p-6 border-r border-zinc-800">Yearly</th>
                                    <th className="p-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filteredFees.map((fee, i) => (
                                    <tr key={i} className="border-t-2 border-black group italic">
                                        <td className="p-6 border-r-2 border-black">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-xl skew-x-[-10deg] group-hover:bg-primary transition-all">
                                                    <div className="skew-x-[10deg]">{getIcon(fee.category)}</div>
                                                </div>
                                                <div>
                                                    <div className="font-black uppercase tracking-tight not-italic">{fee.name}</div>
                                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{fee.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 border-r-2 border-black font-black uppercase italic text-xl whitespace-nowrap">
                                            {typeof fee.daily === 'number' ? `₹${fee.daily}` : fee.daily}
                                        </td>
                                        <td className="p-6 border-r-2 border-black font-black uppercase italic text-xl whitespace-nowrap">
                                            {fee[viewMode].monthly !== '-' ? `₹${fee[viewMode].monthly}` : '-'}
                                        </td>
                                        <td className="p-6 border-r-2 border-black font-black uppercase italic text-xl whitespace-nowrap">
                                            {fee[viewMode].yearly !== '-' ? `₹${fee[viewMode].yearly}` : '-'}
                                        </td>
                                        <td className="p-6">
                                            <button 
                                                onClick={() => startBooking(fee)}
                                                className="bg-black text-white px-6 py-3 font-black uppercase text-[10px] tracking-widest border-2 border-black hover:bg-primary hover:text-black transition-all"
                                            >
                                                Apply Now
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden grid grid-cols-1 gap-6">
                        {filteredFees.map((fee, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                className="border-4 border-black p-6 relative overflow-hidden group active:bg-slate-50"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:text-primary transition-colors">
                                    {getIcon(fee.category)}
                                </div>
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">{fee.category}</span>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">{fee.name}</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 border-t-2 border-black pt-4 italic">
                                        <div>
                                            <div className="text-[8px] font-black uppercase text-zinc-400 mb-1">Daily</div>
                                            <div className="font-black text-lg italic tracking-tight">{typeof fee.daily === 'number' ? `₹${fee.daily}` : fee.daily}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-black uppercase text-zinc-400 mb-1">Monthly</div>
                                            <div className="font-black text-lg italic tracking-tight">{fee[viewMode].monthly !== '-' ? `₹${fee[viewMode].monthly}` : '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-black uppercase text-zinc-400 mb-1">Yearly</div>
                                            <div className="font-black text-lg italic tracking-tight">{fee[viewMode].yearly !== '-' ? `₹${fee[viewMode].yearly}` : '-'}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => startBooking(fee)}
                                        className="w-full bg-black text-white py-4 font-black uppercase text-xs tracking-[0.2em] border-2 border-black active:bg-primary active:text-black transition-all"
                                    >
                                        Submit Application
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredFees.length === 0 && (
                        <div className="text-center py-24 border-4 border-dashed border-slate-200">
                            <p className="text-zinc-400 font-black uppercase tracking-widest italic">No sports found matching your search.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Booking Modal / Journey */}
            <AnimatePresence>
                {checkoutStep > 0 && selectedSport && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeBooking}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white border-8 border-black shadow-[12px_12px_0px_0px_rgba(255,191,0,1)] p-8 overflow-hidden"
                        >
                            <button 
                                onClick={closeBooking}
                                className="absolute top-4 right-4 text-2xl hover:text-primary transition-colors"
                            >
                                <FaTimes />
                            </button>

                            {/* Step 1: Selection */}
                            {checkoutStep === 1 && (
                                <div className="space-y-8">
                                    <div>
                                        <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Step 01 / 03</span>
                                        <h2 className="text-4xl font-black uppercase italic tracking-tighter mt-2">Select <br />Your Plan.</h2>
                                    </div>
                                    
                                    <div className="bg-slate-50 border-4 border-black p-6 flex items-center gap-6">
                                        <div className="text-4xl text-primary">{getIcon(selectedSport.category)}</div>
                                        <div>
                                            <h3 className="font-black uppercase text-xl">{selectedSport.name}</h3>
                                            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest italic">managed by DSA Gulbarga</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {[
                                            { label: 'Monthly Plan', price: selectedSport[viewMode].monthly, icon: <FaStar /> },
                                            { label: 'Yearly Plan', price: selectedSport[viewMode].yearly, icon: <FaGem />, featured: true },
                                        ].map((plan, idx) => (
                                            <button 
                                                key={idx}
                                                disabled={plan.price === '-'}
                                                onClick={() => setCheckoutStep(2)}
                                                className={`flex items-center justify-between p-6 border-4 border-black font-black uppercase tracking-tight transition-all
                                                    ${plan.price === '-' ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:bg-slate-50 active:translate-x-1 active:translate-y-1 active:shadow-none'}
                                                    ${plan.featured ? 'bg-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {plan.icon}
                                                    <span className="text-sm">{plan.label}</span>
                                                </div>
                                                <div className="text-2xl italic tracking-tighter">
                                                    {plan.price !== '-' ? `₹${plan.price}` : 'N/A'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Personal Details */}
                            {checkoutStep === 2 && (
                                <div className="space-y-8">
                                    <div>
                                        <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Step 02 / 03</span>
                                        <h2 className="text-4xl font-black uppercase italic tracking-tighter mt-2">Confirm <br />Profile.</h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1">Full Name</label>
                                            <div className="w-full bg-slate-50 border-2 border-black p-4 font-black uppercase">Ajay Patil</div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest pl-1">ID Number*</label>
                                            <input 
                                                type="text" 
                                                placeholder="AADHAR / PAN / GOVT ID"
                                                className="w-full bg-white border-2 border-black p-4 font-black uppercase outline-none focus:bg-slate-50 transition-colors"
                                            />
                                        </div>
                                        <div className="p-4 bg-primary/10 border-2 border-dashed border-primary text-[9px] font-bold uppercase tracking-tight leading-relaxed italic">
                                            Required Documents: 2 Passport Photos, 1 ID Proof Xerox, and Birth Certificate (if &lt; 16).
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setCheckoutStep(3)}
                                        className="w-full bg-black text-white py-6 font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-primary hover:text-black transition-all"
                                    >
                                        Submit Application <FaChevronRight />
                                    </button>
                                </div>
                            )}

                            {/* Step 3: Success */}
                            {checkoutStep === 3 && (
                                <div className="text-center py-12 space-y-8">
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center text-5xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-black"
                                    >
                                        <FaCheckCircle />
                                    </motion.div>
                                    
                                    <div>
                                        <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Application <br />Successful</h2>
                                        <p className="text-xs font-black uppercase text-zinc-400 tracking-[0.2em] mt-2">District Sports Association</p>
                                    </div>

                                    <div className="bg-slate-50 border-4 border-black p-6 space-y-4 italic">
                                        <div className="flex items-center gap-2 font-black uppercase text-xs not-italic">
                                            <FaIdCard className="text-primary" /> Temp RID: <span className="text-primary italic">#DSA-9921</span>
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed text-left text-zinc-500">
                                            Please visit the **DSA Headquarters (CP Stadium)** within 48 hours to complete biometric verification and collect your Official ID Card.
                                        </p>
                                    </div>

                                    <button 
                                        onClick={closeBooking}
                                        className="w-full border-4 border-black py-6 font-black uppercase text-xs tracking-[0.3em] hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-1 translate-y-1"
                                    >
                                        Return to Portal
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DSA Specific Footer */}
            <footer className="py-12 bg-black text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-2 bg-primary"></div>
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                    <div className="lg:col-span-5">
                        <div className="text-primary font-black text-4xl mb-6 tracking-tighter italic uppercase">DSA Gulbarga.</div>
                        <p className="text-zinc-500 text-sm leading-relaxed uppercase tracking-[0.1em] font-bold max-w-sm">
                            District Sports Association of Gulbarga. Empowering athletes and fostering a culture of excellence in Karnataka since 1980.
                        </p>
                        <div className="mt-12 flex gap-4">
                            <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center text-primary border border-zinc-800 hover:bg-primary hover:text-black transition-colors cursor-pointer"><FaRunning /></div>
                            <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center text-primary border border-zinc-800 hover:bg-primary hover:text-black transition-colors cursor-pointer"><FaBasketballBall /></div>
                            <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center text-primary border border-zinc-800 hover:bg-primary hover:text-black transition-colors cursor-pointer"><FaSwimmingPool /></div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-3">
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10 border-l-4 border-primary pl-4">Quick Links</h4>
                        <div className="flex flex-col gap-5 text-zinc-500 text-xs font-black uppercase tracking-widest">
                            <button onClick={() => navigate('/venues')} className="hover:text-primary text-left transition-colors">Managed Venues</button>
                            <button onClick={() => navigate('/profile')} className="hover:text-primary text-left transition-colors">Academy Login</button>
                            <button onClick={() => navigate('/bookings')} className="hover:text-primary text-left transition-colors">Booking Portal</button>
                            <button onClick={() => navigate('/memberships')} className="hover:text-primary text-left transition-colors">Association Membership</button>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-10 border-l-4 border-primary pl-4">Headquarters</h4>
                        <div className="bg-zinc-900 p-8 border border-zinc-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <p className="text-primary text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-3">
                                <FaMapMarkerAlt /> Chandrasekhar Patil Stadium
                            </p>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
                                Shambhognlli, Gulbarga<br />
                                Gulbarga, Karnataka - 585102
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="container mx-auto px-6 mt-12 pt-10 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-zinc-700 text-[10px] uppercase font-black tracking-[0.5em]">
                        © 2026 District Sports Association Gulbarga
                    </div>
                </div>
            </footer>
        </div>
    );
};
export default Memberships;
