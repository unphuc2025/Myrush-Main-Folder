import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaUserFriends, FaSearch, FaCommentDots, FaHeart, FaGamepad, FaPlus } from 'react-icons/fa';

interface Player {
    rank: number;
    name: string;
    points: number;
    tier: string;
    avatar: string;
    trend: 'up' | 'down' | 'stable';
}

interface Activity {
    id: number;
    user: string;
    avatar: string;
    action: string;
    target: string;
    time: string;
    likes: number;
}

export const Community: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed' | 'squads'>('leaderboard');
    const [showCreateSquadModal, setShowCreateSquadModal] = useState(false);
    const [mySquad, setMySquad] = useState<{ name: string; sport: string } | null>(null);
    const [newSquadName, setNewSquadName] = useState('');
    const [newSquadSport, setNewSquadSport] = useState('Pickleball');

    const leaderboard: Player[] = [
        { rank: 1, name: 'Arjun K.', points: 12500, tier: 'Platinum', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100', trend: 'up' },
        { rank: 2, name: 'Sarah J.', points: 11200, tier: 'Gold', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100', trend: 'up' },
        { rank: 3, name: 'Mike R.', points: 10850, tier: 'Gold', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100', trend: 'down' },
        { rank: 4, name: 'You', points: 2450, tier: 'Silver', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100', trend: 'stable' },
        { rank: 5, name: 'Priya M.', points: 2100, tier: 'Silver', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100', trend: 'up' },
    ];

    const activities: Activity[] = [
        { id: 1, user: 'Arjun K.', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100', action: 'won the match', target: 'Sunday League Final', time: '2h ago', likes: 24 },
        { id: 2, user: 'Sarah J.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100', action: 'joined a squad', target: 'Bengaluru Blasters', time: '5h ago', likes: 12 },
        { id: 3, user: 'Mike R.', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100', action: 'checked in at', target: 'Rush Arena, Koramangala', time: '1d ago', likes: 45 },
    ];

    const handleCreateSquad = () => {
        if (!newSquadName) return;
        setMySquad({ name: newSquadName, sport: newSquadSport });
        setShowCreateSquadModal(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <TopNav />

            {/* Hero Section */}
            <div className="pt-24 md:pt-28 pb-8 md:pb-10 px-4 md:px-6 bg-black text-white rounded-b-3xl md:rounded-b-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-3xl md:text-6xl font-black font-heading uppercase mb-2">
                            Community <span className="text-primary italic">Hub</span>
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg mb-6">Connect, Compete, and Climb the Ranks.</p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/arcade')}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 mx-auto shadow-lg shadow-purple-600/30 transition-all border border-purple-400/50"
                        >
                            <FaGamepad className="text-lg" />
                            Visit Rush Arcade
                        </motion.button>
                    </motion.div>

                    <div className="mt-8 flex flex-wrap justify-center gap-2 md:gap-4 px-2">
                        {['leaderboard', 'feed', 'squads'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-bold uppercase tracking-wider text-[10px] md:text-xs transition-all ${activeTab === tab
                                    ? 'bg-primary text-black scale-105 shadow-glow'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {activeTab === 'leaderboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {leaderboard.map((player) => (
                            <div
                                key={player.rank}
                                className={`flex items-center p-4 rounded-xl border transition-all hover:scale-[1.02] ${player.name === 'You' ? 'bg-primary/10 border-primary shadow-lg ring-1 ring-primary' : 'bg-white border-gray-100 shadow-sm'
                                    }`}
                            >
                                <div className={`w-12 h-12 flex items-center justify-center font-black text-xl italic mr-6 ${player.rank === 1 ? 'text-yellow-500' : player.rank === 2 ? 'text-gray-400' : player.rank === 3 ? 'text-orange-500' : 'text-gray-300'
                                    }`}>
                                    #{player.rank}
                                </div>
                                <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-white" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{player.name}</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase">{player.tier} Member</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black">{player.points.toLocaleString()}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Points</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'feed' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {activities.map((activity) => (
                            <div key={activity.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={activity.avatar} alt={activity.user} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <p className="text-sm">
                                            <span className="font-bold">{activity.user}</span> <span className="text-gray-500">{activity.action}</span> <span className="font-bold text-primary">{activity.target}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                    <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-sm font-bold transition-colors">
                                        <FaHeart /> {activity.likes}
                                    </button>
                                    <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 text-sm font-bold transition-colors">
                                        <FaCommentDots /> Comment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'squads' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {mySquad ? (
                            <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-xl text-center">
                                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary text-4xl mx-auto mb-6 border-4 border-primary/30">
                                    <FaUserFriends />
                                </div>
                                <h3 className="text-3xl font-black uppercase mb-2">{mySquad.name}</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-8">{mySquad.sport} Squad</p>
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-2xl font-black">1</p>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Members</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-2xl font-black">0</p>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Wins</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-2xl font-black">Novice</p>
                                        <p className="text-xs text-gray-400 uppercase font-bold">Rank</p>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full h-12 font-bold border-2">Invite Friends</Button>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 text-4xl mx-auto mb-6">
                                    <FaUserFriends />
                                </div>
                                <h3 className="text-2xl font-black font-heading uppercase mb-2">No Squad Found</h3>
                                <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm md:text-base px-4">You haven't joined a squad yet. Create one or join an existing team to compete in leagues.</p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
                                    <Button
                                        onClick={() => setShowCreateSquadModal(true)}
                                        className="bg-primary hover:bg-primary/90 text-black px-8 py-3 rounded-xl font-bold border-2 border-primary shadow-lg flex items-center gap-2"
                                    >
                                        <FaPlus size={12} /> Create Squad
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => alert('Search feature coming soon!')}
                                        className="px-8 py-3 rounded-xl font-bold flex items-center gap-2"
                                    >
                                        <FaSearch size={12} /> Find Squads
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Create Squad Modal */}
            {showCreateSquadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl relative"
                    >
                        <button
                            onClick={() => setShowCreateSquadModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                        >
                            ✕
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary text-2xl mx-auto mb-4">
                                <FaUserFriends />
                            </div>
                            <h2 className="text-2xl font-black font-heading uppercase">Create New Squad</h2>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Squad Name</label>
                                <input
                                    type="text"
                                    value={newSquadName}
                                    onChange={(e) => setNewSquadName(e.target.value)}
                                    placeholder="e.g. Bangalore Blasters"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary font-bold text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Sport</label>
                                <select
                                    value={newSquadSport}
                                    onChange={(e) => setNewSquadSport(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary font-bold text-lg appearance-none"
                                >
                                    <option value="Pickleball">Pickleball</option>
                                    <option value="Bocce">Bocce</option>
                                    <option value="Badminton">Badminton</option>
                                    <option value="Futsal">Futsal</option>
                                    <option value="Cricket">Cricket</option>
                                    <option value="Tennis">Tennis</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                className="flex-1 bg-gray-100 text-black hover:bg-gray-200 h-12 font-bold rounded-xl border-2 border-transparent"
                                onClick={() => setShowCreateSquadModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-primary text-black hover:bg-primary/90 h-12 font-bold rounded-xl border-2 border-primary shadow-lg"
                                onClick={handleCreateSquad}
                            >
                                Create Squad
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
