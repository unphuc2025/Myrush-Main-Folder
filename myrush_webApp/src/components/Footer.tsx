import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cmsApi } from '../services/cmsApi';
import type { CMSPage } from '../services/cmsApi';
import { settingsApi, IMAGE_BASE_URL } from '../services/settingsApi';
import type { SiteSettings } from '../services/settingsApi';
import { FaInstagram, FaYoutube, FaLinkedin } from 'react-icons/fa';
import { featureFlags } from '../config/featureFlags';

export const Footer: React.FC = () => {
    const location = useLocation();
    const [cmsPages, setCmsPages] = useState<CMSPage[]>([]);
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        cmsApi.getAllActive().then(setCmsPages).catch(console.error);
        settingsApi.get().then(setSettings).catch(console.error);
    }, []);

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
    const hasLegalPages = cmsPages.filter(p => p.slug !== 'terms').length > 0;

    return (
        <footer className="bg-white border-t border-zinc-200 pt-3 pb-20 md:py-6 w-full">
            <div className="w-full px-6 md:px-12 lg:px-24">
                <div className={`grid grid-cols-1 ${hasLegalPages ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-6 mb-4 text-zinc-900 text-sm`}>
                    <div className="col-span-1 md:col-span-2">
                        {settings?.site_logo ? (
                            <img src={`${IMAGE_BASE_URL}${settings.site_logo}`} alt="Rush" className="h-20 mb-2 object-contain" />
                        ) : (
                            <img src="/Rush-logo.webp" alt="Rush" className="h-20 mb-2 object-contain" />
                        )}
                        <p className="max-w-xl mb-6 text-sm leading-relaxed text-zinc-600">
                            The premier destination for sports enthusiasts. Book world-class venues, join elite academies, and compete in high-stakes tournaments.
                        </p>
                        <div className="flex gap-6">
                            {settings?.instagram_url && (
                                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-primary transition-all transform hover:scale-110 duration-200">
                                    <FaInstagram size={20} />
                                </a>
                            )}
                            {settings?.youtube_url && (
                                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-red-500 transition-all transform hover:scale-110 duration-200">
                                    <FaYoutube size={20} />
                                </a>
                            )}
                            {settings?.linkedin_url && (
                                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-zinc-900 hover:text-blue-500 transition-all transform hover:scale-110 duration-200">
                                    <FaLinkedin size={20} />
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="font-heading font-black uppercase tracking-widest text-primary mb-6">Quick Links</h4>
                        <ul className="grid grid-cols-2 md:grid-cols-1 gap-y-4 gap-x-4 text-base">
                            {navItems.map(item => (
                                <li key={item.name}>
                                    <Link
                                        to={item.path}
                                        onClick={() => window.scrollTo(0, 0)}
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
                    {cmsPages.filter(p => p.slug !== 'terms').length > 0 && (
                        <div className="col-span-1 md:col-span-1">
                            <h4 className="font-heading font-black uppercase tracking-widest text-primary mb-6">Legal & Info</h4>
                            <ul className="grid grid-cols-1 gap-y-4 text-base">
                                {cmsPages.filter(p => p.slug !== 'terms').map(page => (
                                    <li key={page.id}>
                                        <Link
                                            to={`/p/${page.slug}`}
                                            onClick={() => window.scrollTo(0, 0)}
                                            className={`transition-all duration-300 block font-heading uppercase tracking-wider text-sm font-bold ${isActive(`/p/${page.slug}`)
                                                ? 'text-primary'
                                                : 'text-zinc-500 hover:text-zinc-900 hover:translate-x-1'
                                                }`}
                                        >
                                            {page.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="col-span-1 md:col-span-1">
                        <h4 className="font-heading font-black uppercase tracking-widest text-primary mb-6">Contact Us</h4>
                        <div className="text-sm text-zinc-600 space-y-4 font-sans">
                            <div className="space-y-1">
                                {settings?.company_name && (
                                    <p className="font-bold text-zinc-900">{settings.company_name}</p>
                                )}
                                {settings?.address ? (
                                    <p className="whitespace-pre-wrap">{settings.address}</p>
                                ) : (
                                    <>
                                        {!settings?.company_name && <p className="font-bold text-zinc-900">Addrush Sports Private Limited</p>}
                                        <p># 643/2, 12th Main Rd, 2nd Block,</p>
                                        <p>Rajajinagar, Bengaluru, KA 560010</p>
                                    </>
                                )}
                            </div>
                            <div className="pt-2 space-y-2">
                                <a href={`mailto:${settings?.email || 'harsha@myrush.in'}`} className="block hover:text-primary transition-colors">{settings?.email || 'harsha@myrush.in'}</a>
                                <p className="text-zinc-900 font-black text-xl tracking-tight">{settings?.contact_number || '+91 76248 98999'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t border-zinc-200 pt-3 flex flex-col md:flex-row justify-between items-center text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-normal">
                    <p>{settings?.copyright_text || '© 2026 Addrush Sports Private Limited.'}</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <Link to="/p/terms" onClick={() => window.scrollTo(0, 0)} className="hover:text-primary transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
