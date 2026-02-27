import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';
import { featureFlags } from '../config/featureFlags';

export const Footer: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Home', path: '/' },
        featureFlags.enableGames && { name: 'Games', path: '/open-play' },
        { name: 'Academy', path: '/academy' },
        { name: 'Arena', path: '/arena' },
        { name: 'Corporate', path: '/corporate' },
        { name: 'Pickleball', path: '/pickleball' },
        featureFlags.enableCommunity && { name: 'Community', path: '/community' },
        featureFlags.enableStore && { name: 'Store', path: '/store' },
    ].filter((item): item is { name: string; path: string } => Boolean(item));

    const isActive = (path: string) => location.pathname === path;

    return (
        <footer className="bg-white border-t border-zinc-200 pt-8 pb-28 md:py-12 w-full">
            <div className="w-full px-6 md:px-12 lg:px-24">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-zinc-900 text-sm">
                    <div className="col-span-1 md:col-span-2">
                        <img src="/Rush-logo.webp" alt="Rush" className="h-32 mb-4 object-contain" />
                        <p className="max-w-xl mb-6 text-sm leading-relaxed text-zinc-600">
                            The premier destination for sports enthusiasts. Book world-class venues, join elite academies, and compete in high-stakes tournaments.
                        </p>
                        <div className="flex gap-6">
                            <a href="https://www.instagram.com/rush_arena/" target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-primary transition-all transform hover:scale-110 duration-200">
                                <FaInstagram size={20} />
                            </a>
                            <a href="https://www.youtube.com/@rushsportsindia/featured" target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-red-500 transition-all transform hover:scale-110 duration-200">
                                <FaYoutube size={20} />
                            </a>
                            <a href="https://www.linkedin.com/company/addrush-sports/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-blue-500 transition-all transform hover:scale-110 duration-200">
                                <FaLinkedin size={20} />
                            </a>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="font-heading font-black uppercase tracking-widest text-primary mb-6">Quick Links</h4>
                        <ul className="grid grid-cols-2 md:grid-cols-1 gap-y-4 gap-x-4 text-base">
                            {navItems.map(item => (
                                <li key={item.name}>
                                    <Link
                                        to={item.path}
                                        className={`transition-all duration-300 block font-heading uppercase tracking-wider text-sm font-bold ${isActive(item.path)
                                            ? 'text-primary'
                                            : 'text-zinc-500 hover:text-zinc-900 hover:translate-x-1'
                                            }`}
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="font-heading font-black uppercase tracking-widest text-primary mb-6">Contact Us</h4>
                        <div className="text-sm text-zinc-600 space-y-4 font-sans">
                            <div className="space-y-1">
                                <p className="font-bold text-zinc-900">Addrush Sports Private Limited</p>
                                <p># 643/2, 12th Main Rd, 2nd Block,</p>
                                <p>Rajajinagar, Bengaluru, KA 560010</p>
                            </div>
                            <div className="pt-2 space-y-2">
                                <a href="mailto:harsha@myrush.in" className="block hover:text-primary transition-colors">harsha@myrush.in</a>
                                <p className="text-zinc-900 font-black text-xl tracking-tight">+91 76248 98999</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-zinc-200 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] md:text-xs text-zinc-400 uppercase tracking-[0.2em] font-bold">
                    <p>© 2026 Addrush Sports Private Limited.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
