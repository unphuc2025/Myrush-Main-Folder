import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    HiHome,
    HiOutlineHome,
    HiCalendar,
    HiOutlineCalendar,
    HiUser,
    HiOutlineUser,
    HiSearch,
    HiOutlineSearch
} from 'react-icons/hi';

export const MobileNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            label: 'Home',
            path: '/',
            alternativePath: '/dashboard',
            icon: HiOutlineHome,
            activeIcon: HiHome,
        },
        {
            label: 'Book',
            path: '/venues',
            icon: HiOutlineSearch,
            activeIcon: HiSearch,
        },
        {
            label: 'Bookings',
            path: '/bookings',
            icon: HiOutlineCalendar,
            activeIcon: HiCalendar,
        },
        {
            label: 'Profile',
            path: '/profile',
            icon: HiOutlineUser,
            activeIcon: HiUser,
        },
    ];

    const isActive = (item: any) => {
        if (item.path === '/' && location.pathname === '/dashboard') return true;
        return location.pathname === item.path || (item.alternativePath && location.pathname === item.alternativePath);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pointer-events-none">
            <nav className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-2 flex items-center justify-around pointer-events-auto max-w-md mx-auto relative overflow-hidden">
                {/* Background active pill tracker */}
                {navItems.map((item, index) => {
                    const active = isActive(item);
                    return (
                        <button
                            key={index}
                            onClick={() => navigate(item.path)}
                            className="flex flex-col items-center justify-center py-2 px-1 relative w-1/4 h-14 group"
                        >
                            <div className="relative z-10 flex flex-col items-center">
                                <motion.div
                                    animate={{
                                        scale: active ? 1.1 : 1,
                                        color: active ? '#000000' : '#8e8e93'
                                    }}
                                    className="transition-colors duration-300"
                                >
                                    {active ? <item.activeIcon className="w-6 h-6" /> : <item.icon className="w-6 h-6" />}
                                </motion.div>
                                <span className={`text-[10px] font-black uppercase tracking-[0.05em] mt-1 transition-all duration-300 ${active ? 'text-black opacity-100 scale-100' : 'text-gray-400 opacity-70 scale-95'}`}>
                                    {item.label}
                                </span>
                            </div>

                            {active && (
                                <motion.div
                                    layoutId="mobileNavActive"
                                    className="absolute inset-0 bg-primary/10 rounded-2xl z-0"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            {/* Subtle dot indicator */}
                            {active && (
                                <motion.div
                                    layoutId="activeDot"
                                    className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-glow"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
