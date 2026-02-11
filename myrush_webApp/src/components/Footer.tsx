import React from 'react';
import { FaInstagram, FaYoutube, FaLinkedin, FaTwitter } from 'react-icons/fa';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-black border-t border-white/10 py-10 md:py-8 w-full px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-white">
                    <div className="col-span-1 md:col-span-2">
                        <img src="/Rush-logo.webp" alt="Rush" className="h-20 mb-6 object-contain" />
                        <p className="max-w-xl mb-8 text-base leading-relaxed text-gray-400">
                            The premier destination for sports enthusiasts. Book world-class venues, join elite academies, and compete in high-stakes tournaments.
                        </p>
                        <div className="flex gap-6">
                            <a href="#" className="text-white hover:text-primary transition-colors transform hover:scale-110 duration-200">
                                <FaInstagram size={20} />
                            </a>
                            <a href="#" className="text-white hover:text-red-500 transition-colors transform hover:scale-110 duration-200">
                                <FaYoutube size={20} />
                            </a>
                            <a href="#" className="text-white hover:text-blue-500 transition-colors transform hover:scale-110 duration-200">
                                <FaLinkedin size={20} />
                            </a>
                            <a href="#" className="text-white hover:text-blue-400 transition-colors transform hover:scale-110 duration-200">
                                <FaTwitter size={20} />
                            </a>
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <ul className="space-y-4 text-base">
                            {['Academy', 'Arena', 'Corporate', 'Tournaments', 'Pickleball', 'Careers'].map(item => (
                                <li key={item}><a href={item === 'Pickleball' ? '/pickleball' : '#'} className="hover:text-primary transition-colors block text-gray-400 hover:text-white">{item}</a></li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="text-white font-bold uppercase tracking-wider mb-8 text-lg">Contact</h4>
                        <p className="mb-4 text-base leading-relaxed text-gray-400"># 643/2, 12th Main Rd,<br />Rajajinagar, Bengaluru</p>
                        <p className="mb-4 hover:text-primary cursor-pointer transition-colors text-gray-400">harsha@myrush.in</p>
                        <p className="text-white font-bold text-xl">+91 7624898999</p>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p className="font-medium tracking-wide">© 2026 Addrush Sports Private Limited.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a href="#" className="hover:text-gray-300 transition-colors uppercase tracking-wider font-medium">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-300 transition-colors uppercase tracking-wider font-medium">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
