import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { FaCrown, FaGift, FaHistory, FaStar } from 'react-icons/fa';

export const Loyalty: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');

    const userPoints = 2450;
    const currentTier = 'Gold';
    const nextTier = 'Platinum';
    const pointsToNextTier = 550;
    const progress = 82; // %

    const rewards = [
        { id: 1, title: 'Free 1 Hour Booking', cost: 2000, image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070', type: 'Booking' },
        { id: 2, title: 'Rush Official Jersey', cost: 1500, image: 'https://plus.unsplash.com/premium_photo-1677158913955-h6d8196e3869?q=80&w=2070', type: 'Merch' },
        { id: 3, title: 'Gatorade Pack (6x)', cost: 500, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070', type: 'F&B' },
        { id: 4, title: '50% Off Tournament Entry', cost: 1000, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070', type: 'Discount' },
    ];

    const history = [
        { id: 1, action: 'Booking Completed', points: '+50', date: 'Oct 24, 2026', type: 'earn' },
        { id: 2, action: 'Review Submitted', points: '+10', date: 'Oct 25, 2026', type: 'earn' },
        { id: 3, action: 'Redeemed: Water Bottle', points: '-200', date: 'Oct 20, 2026', type: 'spend' },
        { id: 4, action: 'League Registration', points: '+100', date: 'Oct 15, 2026', type: 'earn' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <TopNav />

            {/* Loyalty Hero Card */}
            <div className="pt-28 pb-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden shadow-2xl"
                    >
                        {/* Abstract Background */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xl shadow-lg shadow-yellow-400/50">
                                        <FaCrown />
                                    </div>
                                    <span className="text-yellow-400 font-black uppercase tracking-widest text-[10px] md:text-sm">{currentTier} Member</span>
                                </div>
                                <h1 className="text-4xl md:text-7xl font-black text-white font-heading mb-2">
                                    {userPoints.toLocaleString()}
                                </h1>
                                <p className="text-gray-400 text-[10px] md:text-sm font-bold uppercase tracking-wider">Rush Points Balance</p>
                            </div>

                            <div className="w-full md:w-64 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <div className="flex justify-between text-xs font-bold text-white mb-2">
                                    <span>{currentTier}</span>
                                    <span>{nextTier}</span>
                                </div>
                                <div className="w-full bg-black/50 rounded-full h-2 mb-3">
                                    <div className="bg-gradient-to-r from-yellow-400 to-primary h-2 rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-[10px] text-gray-400 text-center">
                                    Earn <span className="text-white font-bold">{pointsToNextTier}</span> more points to reach {nextTier}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto px-6 mb-8 overflow-x-auto scrollbar-hide">
                <div className="flex gap-4 md:gap-8 border-b border-gray-200 min-w-max">
                    <button
                        onClick={() => setActiveTab('rewards')}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'rewards' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <FaGift className="inline mr-2" /> Rewards Store
                        {activeTab === 'rewards' && <motion.div layoutId="loyaltyTab" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'history' ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <FaHistory className="inline mr-2" /> History
                        {activeTab === 'history' && <motion.div layoutId="loyaltyTab" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-t-full" />}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 pb-24">
                {activeTab === 'rewards' ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        {rewards.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm flex items-center md:items-start gap-4 hover:shadow-lg transition-shadow">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col justify-between flex-grow h-full py-1">
                                    <div>
                                        <span className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1 block">{item.type}</span>
                                        <h3 className="font-bold text-gray-900 leading-tight mb-2 text-sm md:text-base">{item.title}</h3>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-primary font-black text-sm">
                                            <FaStar className="text-[10px]" />
                                            <span>{item.cost}</span>
                                        </div>
                                        <button
                                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-colors ${userPoints >= item.cost
                                                ? 'bg-black text-white hover:bg-gray-800'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                            disabled={userPoints < item.cost}
                                        >
                                            Redeem
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                        {history.map((item, i) => (
                            <div key={item.id} className={`p-6 flex items-center justify-between ${i !== history.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${item.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {item.type === 'earn' ? '↗' : '↘'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{item.action}</p>
                                        <p className="text-xs text-gray-500 font-medium">{item.date}</p>
                                    </div>
                                </div>
                                <span className={`font-black ${item.type === 'earn' ? 'text-green-600' : 'text-gray-900'
                                    }`}>
                                    {item.points}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};
