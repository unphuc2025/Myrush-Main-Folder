import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaRunning, 
    FaBasketballBall, 
    FaSwimmingPool, 
    FaMapMarkerAlt
} from 'react-icons/fa';

export const Footer: React.FC = () => {
    const navigate = useNavigate();

    return (
        <footer className="py-12 bg-black text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-2 bg-primary"></div>
            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
                <div className="lg:col-span-12 mb-4 md:hidden">
                     {/* Mobile Logo Only */}
                     <div className="text-primary font-black text-3xl tracking-tighter italic uppercase">DSA Gulbarga.</div>
                </div>

                <div className="lg:col-span-5">
                    <div className="hidden md:block text-primary font-black text-4xl mb-6 tracking-tighter italic uppercase">DSA Gulbarga.</div>
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
                    <div className="bg-zinc-900 p-8 border border-zinc-800">
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
    );
};
