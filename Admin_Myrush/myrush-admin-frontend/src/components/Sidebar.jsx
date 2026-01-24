import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
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
    IndianRupee,
    Tag,
    PieChart,
    Users,
    ArrowLeft
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen, onLogout }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const trigger = useRef(null);
    const sidebar = useRef(null);
    const sidebarContent = useRef(null);

    // Persist Scroll Position
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('sidebar-scroll');
        if (sidebarContent.current && savedScroll) {
            sidebarContent.current.scrollTop = Number(savedScroll);
        }
    }, [location.pathname]); // Restore on route change if component doesn't unmount, or on mount.
    // If Sidebar unmounts, [] is enough. If it stays mounted but route changes, we might want to ensure it stays?
    // User wants "when i select it should be there only". If sidebar unmounts, we need to restore on mount.
    // So [] is correct for restore on mount.

    const handleScroll = (e) => {
        sessionStorage.setItem('sidebar-scroll', e.target.scrollTop);
    };

    const [bookingsExpanded, setBookingsExpanded] = useState(
        location.pathname.startsWith('/bookings')
    );


    const [usersRolesExpanded, setUsersRolesExpanded] = useState(
        location.pathname.startsWith('/roles') ||
        location.pathname.startsWith('/admins') ||
        location.pathname.startsWith('/users')
    );

    const [userRole, setUserRole] = useState('super_admin');

    useEffect(() => {
        const adminInfo = localStorage.getItem('admin_info');
        if (adminInfo) {
            const parsed = JSON.parse(adminInfo);
            setUserRole(parsed.role || 'super_admin');
        }
    }, []);

    // Close sidebar on click outside
    useEffect(() => {
        const clickHandler = ({ target }) => {
            if (!sidebar.current || !trigger.current) return;
            if (
                !sidebarOpen ||
                sidebar.current.contains(target) ||
                trigger.current.contains(target)
            )
                return;
            setSidebarOpen(false);
        };
        document.addEventListener('click', clickHandler);
        return () => document.removeEventListener('click', clickHandler);
    }, [sidebarOpen]);

    // Close on Esc
    useEffect(() => {
        const keyHandler = ({ keyCode }) => {
            if (!sidebarOpen || keyCode !== 27) return;
            setSidebarOpen(false);
        };
        document.addEventListener('keydown', keyHandler);
        return () => document.removeEventListener('keydown', keyHandler);
    }, [sidebarOpen]);

    const bookingsItems = [
        { id: 'manage', label: 'Manage Bookings', icon: Calendar },
        { id: 'transactions', label: 'Transactions & Earnings', icon: IndianRupee },
    ];

    const isActive = (path) => location.pathname === path;
    const isBookingsActive = (bookingId) => location.pathname === '/bookings' && location.hash === `#${bookingId}`;

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

    const handleUsersRolesClick = (e) => {
        e.preventDefault();
        setUsersRolesExpanded(!usersRolesExpanded);
    };

    // Auto-close sidebar on navigation for mobile
    const handleLinkClick = () => {
        if (window.innerWidth < 1024) { // lg breakpoint
            setSidebarOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-9998 bg-black/50 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <aside
                ref={sidebar}
                className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* <!-- SIDEBAR HEADER --> */}
                <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <img
                            src={logo}
                            alt="MyRush Logo"
                            className="h-10 w-auto object-contain rounded-md"
                        />
                    </Link>

                    <button
                        ref={trigger}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-controls="sidebar"
                        aria-expanded={sidebarOpen}
                        className="block lg:hidden"
                    >
                        <ArrowLeft className="h-6 w-6 text-white" />
                    </button>
                </div>
                {/* <!-- SIDEBAR HEADER --> */}

                <div ref={sidebarContent} onScroll={handleScroll} className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
                    <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">

                        {/* MENU GROUP */}
                        <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                                MENU
                            </h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                <li>
                                    <Link
                                        to="/dashboard"
                                        onClick={handleLinkClick}
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2.5 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 min-h-[44px] ${isActive('/dashboard') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Home className="h-5 w-5" />
                                        <span>Dashboard</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* USERS AND ROLES GROUP */}
                        <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                                USERS AND ROLES
                            </h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                <li>
                                    <Link
                                        to="#"
                                        onClick={handleUsersRolesClick}
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${usersRolesExpanded ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Users className="h-5 w-5" />
                                        <span>Users and Roles</span>
                                        <svg
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${usersRolesExpanded ? 'rotate-180' : ''}`}
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                                                fill=""
                                            />
                                        </svg>
                                    </Link>
                                    {/* Dropdown Menu */}
                                    <div className={`translate transform overflow-hidden ${usersRolesExpanded ? '!h-auto' : '!h-0'}`}>
                                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                                            <li>
                                                <Link
                                                    to="/roles"
                                                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${isActive('/roles') ? 'text-white' : ''}`}
                                                >
                                                    Role Management
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/admins"
                                                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${isActive('/admins') ? 'text-white' : ''}`}
                                                >
                                                    Sub Admin Management
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/users"
                                                    className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${isActive('/users') ? 'text-white' : ''}`}
                                                >
                                                    User Management
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* OPERATIONS GROUP */}
                        <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                                OPERATIONS
                            </h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                {/* Bookings with Submenu */}
                                <li>
                                    <Link
                                        to="/bookings"
                                        onClick={handleBookingsClick}
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/bookings') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Calendar className="h-5 w-5" />
                                        <span>Bookings</span>
                                        <svg
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 fill-current ${bookingsExpanded ? 'rotate-180' : ''}`}
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                clipRule="evenodd"
                                                d="M4.41107 6.9107C4.73651 6.58527 5.26414 6.58527 5.58958 6.9107L10.0003 11.3214L14.4111 6.91071C14.7365 6.58527 15.2641 6.58527 15.5896 6.91071C15.915 7.23614 15.915 7.76378 15.5896 8.08922L10.5896 13.0892C10.2641 13.4147 9.73651 13.4147 9.41107 13.0892L4.41107 8.08922C4.08563 7.76378 4.08563 7.23614 4.41107 6.9107Z"
                                                fill=""
                                            />
                                        </svg>
                                    </Link>
                                    {/* Dropdown Menu */}
                                    <div className={`translate transform overflow-hidden ${bookingsExpanded ? '!h-auto' : '!h-0'}`}>
                                        <ul className="mt-4 mb-5.5 flex flex-col gap-2.5 pl-6">
                                            {bookingsItems.map(subItem => (
                                                <li key={subItem.id}>
                                                    <button
                                                        onClick={() => handleBookingsItemClick(subItem.id)}
                                                        className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${isBookingsActive(subItem.id) ? 'text-white' : ''}`}
                                                    >
                                                        {subItem.label}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>

                                <li>
                                    <Link
                                        to="/venues"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/venues') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Layout className="h-5 w-5" />
                                        <span>Venues</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/courts"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/courts') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Play className="h-5 w-5" />
                                        <span>Courts</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/calendar"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/calendar') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Calendar className="h-5 w-5" />
                                        <span>Slots Calendar</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* MARKETING GROUP */}
                        <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                                MARKETING
                            </h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                <li>
                                    <Link
                                        to="/coupons"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/coupons') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Tag className="h-5 w-5" />
                                        <span>Coupons</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/reviews"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/reviews') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <FileText className="h-5 w-5" />
                                        <span>Reviews</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/reports"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/reports') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <PieChart className="h-5 w-5" />
                                        <span>Analytics</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* LEGAL GROUP */}
                        <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                                LEGAL & CONTENT
                            </h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                <li>
                                    <Link
                                        to="/policies"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/policies') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <FileText className="h-5 w-5" />
                                        <span>Policies & Terms</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/faqs"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/faqs') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <FileText className="h-5 w-5" />
                                        <span>FAQ Management</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/cms"
                                        className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/cms') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                    >
                                        <Layers className="h-5 w-5" />
                                        <span>CMS Pages</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* SETTINGS GROUP */}
                        <div>
                            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                                SETTINGS
                            </h3>
                            <ul className="mb-6 flex flex-col gap-1.5">
                                {userRole === 'super_admin' && (
                                    <>
                                        <li>
                                            <Link
                                                to="/cities"
                                                className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/cities') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                            >
                                                <MapPin className="h-5 w-5" />
                                                <span>Cities & Areas</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/game-types"
                                                className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/game-types') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                            >
                                                <Settings className="h-5 w-5" />
                                                <span>Game Types</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/amenities"
                                                className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/amenities') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                            >
                                                <Puzzle className="h-5 w-5" />
                                                <span>Amenities</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/settings"
                                                className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/settings') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                            >
                                                <Settings className="h-5 w-5" />
                                                <span>Site Config</span>
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="/playo-tokens"
                                                onClick={handleLinkClick}
                                                className={`group relative flex items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${isActive('/playo-tokens') ? 'bg-graydark dark:bg-meta-4' : ''}`}
                                            >
                                                <Lock className="h-5 w-5" />
                                                <span>Playo Tokens</span>
                                            </Link>
                                        </li>


                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Logout Section */}
                        <div className="mt-auto border-t border-strokedark pt-4">
                            <button
                                onClick={onLogout}
                                className="group relative flex w-full items-center gap-2.5 rounded-sm py-2 px-4 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4"
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Sign Out</span>
                            </button>
                        </div>

                    </nav>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
