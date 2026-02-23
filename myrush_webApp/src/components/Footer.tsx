import React from 'react';
import { FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-zinc-900 border-t border-white/10 py-3 md:py-4 w-full px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 text-white text-sm">
                    <div className="col-span-1 md:col-span-2">
                        <img src="/Rush-logo.webp" alt="Rush" className="h-24 mb-3 object-contain" />
                        <p className="max-w-xl mb-4 text-sm leading-relaxed text-gray-400">
                            The premier destination for sports enthusiasts. Book world-class venues, join elite academies, and compete in high-stakes tournaments.
                        </p>
                        <div className="flex gap-6">
                            <a href="https://www.instagram.com/rush_arena/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary transition-colors transform hover:scale-110 duration-200">
                                <FaInstagram size={20} />
                            </a>
                            <a href="https://www.youtube.com/@rushsportsindia/featured" target="_blank" rel="noopener noreferrer" className="text-white hover:text-red-500 transition-colors transform hover:scale-110 duration-200">
                                <FaYoutube size={20} />
                            </a>
                            <a href="https://www.linkedin.com/company/addrush-sports/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-500 transition-colors transform hover:scale-110 duration-200">
                                <FaLinkedin size={20} />
                            </a>

                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <ul className="space-y-4 text-base">
                            {[
                                { name: 'Academy', path: '/academy' },
                                { name: 'Arena', path: '/arena' },
                                { name: 'Corporate', path: '/corporate' },
                                { name: 'Tournaments', path: '/events' }, // Assumed mapping based on App.tsx
                                { name: 'Pickleball', path: '/pickleball' }
                            ].map(item => (
                                <li key={item.name}><a href={item.path} className="hover:text-primary transition-colors block text-gray-400 hover:text-white">{item.name}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <div className="text-xs text-gray-400 space-y-1">
                            <p className="font-semibold text-white mb-1">Addrush Sports Private Limited</p>
                            <p># 643/2, 12th Main Rd, 2nd Block,</p>
                            <p>Rajajinagar, Bengaluru, Karnataka 560010</p>
                            <div className="pt-2">
                                <p className="hover:text-primary cursor-pointer transition-colors">harsha@myrush.in</p>
                                <p className="text-white font-bold text-base">+91 7624898999</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row justify-between items-center text-xs text-white">
                    <p className="font-medium tracking-wide opacity-80 hover:opacity-100 transition-opacity">© 2026 Addrush Sports Private Limited.</p>
                    <div className="flex gap-8 mt-2 md:mt-0">
                        <a href="/terms" className="opacity-80 hover:opacity-100 transition-opacity uppercase tracking-wider font-medium">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
