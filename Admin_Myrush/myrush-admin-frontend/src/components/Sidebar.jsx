import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/myrushlogo.png';
import {
    Home,
    Calendar,
    Layout,
    BarChart2,
    Table,
    Lock,
    FileText,
    Plus,
    Settings,
    LogOut,
    Layers,
    MapPin,
    Building,
    Play,
    Puzzle,
    DollarSign,
    Tag,
    Users,
} from 'lucide-react';

const Sidebar = ({ onLogout }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [settingsExpanded, setSettingsExpanded] = useState(location.pathname.startsWith('/settings'));
    const [bookingsExpanded, setBookingsExpanded] = useState(location.pathname.startsWith('/bookings'));

    const [userRole, setUserRole] = useState('super_admin');

    useEffect(() => {
        const adminInfo = localStorage.getItem('admin_info');
        if (adminInfo) {
            const parsed = JSON.parse(adminInfo);
            setUserRole(parsed.role || 'super_admin');
        }
    }, []);

    const menuItems = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Calendar, label: 'Bookings', path: '/bookings', isExpandable: true },
        { icon: Layout, label: 'Venues', path: '/venues' },
        // Only show Manage Admins to super_admin
        ...(userRole === 'super_admin' ? [{ icon: Users, label: 'Manage Admins', path: '/admins' }] : []),
        { icon: Tag, label: 'Manage Coupons', path: '/coupons' },
        { icon: FileText, label: 'Ratings & Reviews', path: '/reviews' },
        { icon: Settings, label: 'Settings', path: '/settings', isExpandable: true },
        { icon: Calendar, label: 'Court Slots Calendar', path: '/calendar' },
        // { icon: BarChart2, label: 'Charts', path: '/charts' },
        // { icon: Table, label: 'Tables', path: '/tables' },
        // { icon: Lock, label: 'User Pages', path: '/user-pages' },
        // { icon: FileText, label: 'Documentation', path: '/docs' },
    ];

    const bookingsItems = [
        { id: 'manage', label: 'Manage Bookings', icon: Calendar },
        { id: 'transactions', label: 'Transactions & Earnings', icon: DollarSign },
        { id: 'policies', label: 'Policies & Terms', icon: FileText },
    ];

    const settingsItems = [
        ...(userRole === 'super_admin' ? [
            { id: 'cities', label: 'Cities & Areas', icon: MapPin },
            { id: 'branches', label: 'Branches', icon: Building },
        ] : []),
        { id: 'courts', label: 'Courts', icon: Play },
        ...(userRole === 'super_admin' ? [
            { id: 'game-types', label: 'Game Types', icon: Settings },
            { id: 'amenities', label: 'Amenities', icon: Puzzle },
        ] : []),
    ];

    const isActive = (path) => location.pathname === path;
    const isBookingsActive = (bookingId) => location.pathname === '/bookings' && location.hash === `#${bookingId}`;
    const isSettingsActive = (settingId) => location.pathname === '/settings' && (location.hash === `#${settingId}` || (!location.hash && settingId === 'cities'));

    const handleBookingsClick = (e) => {
        e.preventDefault();
        if (location.pathname !== '/bookings') {
            navigate('/bookings');
        }
        setBookingsExpanded(!bookingsExpanded);
    };

    const handleBookingsItemClick = (bookingId) => {
        navigate(`/bookings#${bookingId}`);
        setBookingsExpanded(true);
    };

    const handleSettingsClick = (e) => {
        e.preventDefault();
        if (location.pathname !== '/settings') {
            navigate('/settings');
        }
        setSettingsExpanded(!settingsExpanded);
    };

    const handleSettingsItemClick = (settingId) => {
        navigate(`/settings#${settingId}`);
        setSettingsExpanded(true);
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-48 bg-gradient-to-b from-gray-50 to-white shadow-xl border-r border-gray-100 transition-transform overflow-y-auto">
            {/* Logo Area */}
            <div className="flex h-20 items-center px-6 border-b border-gray-100">
                <img
                    src={logo}
                    alt="MyRush Logo"
                    className="h-12 w-auto object-contain border-2 border-purple-200 rounded-lg shadow-sm"
                />
            </div>

            {/* User Profile Summary */}
            <div className="border-b border-gray-100 px-6 py-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <img
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt="Admin"
                            className="h-14 w-14 rounded-xl object-cover border-3 border-purple-100"
                        />
                        <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">David Grey. H</p>
                        <p className="text-xs text-gray-500">Project Manager</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="px-4 py-6">
                <ul className="space-y-2 mb-8">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            {item.isExpandable ? (
                                <button
                                    onClick={item.label === 'Bookings' ? handleBookingsClick : handleSettingsClick}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 w-full ${isActive(item.path)
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-600'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </button>
                            ) : (
                                <Link
                                    to={item.path}
                                    onClick={() => item.label !== 'Settings' ? setSettingsExpanded(false) : null}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-600'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            )}
                            {item.label === 'Settings' && settingsExpanded && (
                                <div className="pl-6 space-y-1 mt-2">
                                    {settingsItems.map((setting) => {
                                        const Icon = setting.icon;
                                        return (
                                            <button
                                                key={setting.id}
                                                onClick={() => handleSettingsItemClick(setting.id)}
                                                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${isSettingsActive(setting.id)
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{setting.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {item.label === 'Bookings' && bookingsExpanded && (
                                <div className="pl-6 space-y-1 mt-2">
                                    {bookingsItems.map((booking) => {
                                        const Icon = booking.icon;
                                        return (
                                            <button
                                                key={booking.id}
                                                onClick={() => handleBookingsItemClick(booking.id)}
                                                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${isBookingsActive(booking.id)
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                                    }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{booking.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>

                {/* Divider */}
                <div className="my-6 border-t border-gray-200"></div>

                {/* Projects Section */}
                <div className="mb-8">
                    <p className="mb-4 px-2 text-xs font-bold uppercase tracking-widest text-gray-500">Projects</p>
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95">
                        <Plus className="h-5 w-5" />
                        <span>Add Project</span>
                    </button>
                </div>

                {/* Categories Section */}
                <div className="mb-8">
                    <p className="mb-4 px-2 text-xs font-bold uppercase tracking-widest text-gray-500">Categories</p>
                    <div className="space-y-3 px-2">
                        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
                            <span className="text-sm font-medium text-gray-700">Free</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>
                            <span className="text-sm font-medium text-gray-700">Pro</span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-gray-200"></div>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
