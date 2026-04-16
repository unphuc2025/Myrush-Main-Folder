import React from 'react';
import { Search, Mail, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationWidget from './NotificationWidget';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    const adminInfo = localStorage.getItem('admin_info');
    const parsed = adminInfo ? JSON.parse(adminInfo) : {};
    const userRole = parsed.role || null;

    return (
        <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none">
            <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
                <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
                    {/* Hamburger Toggle BTN */}
                    <button
                        aria-controls="sidebar"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSidebarOpen(!sidebarOpen);
                        }}
                        className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <Link className="block flex-shrink-0 lg:hidden" to="/dashboard">
                        {/* Mobile Logo Placeholder */}
                        <span className="font-bold text-lg text-primary">Admin</span>
                    </Link>
                </div>

                {/* Search Bar Removed (Non-functional) */}
                <div className="hidden sm:block">
                    {/* <form action="#" method="POST">
                        <div className="relative">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2">
                                <Search className="h-5 w-5 text-bodydark2 hover:text-primary" />
                            </button>

                            <input
                                type="text"
                                placeholder="Type to search..."
                                className="w-full bg-transparent pl-9 pr-4 text-black focus:outline-none dark:text-white xl:w-125 text-slate-900"
                            />
                        </div>
                    </form> */}
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                    <ul className="flex items-center gap-2 2xsm:gap-4">
                        <NotificationWidget />
                    </ul>

                    {/* User Area */}
                    <div className="relative flex items-center gap-4">
                        <span className="hidden text-right lg:block">
                            <span className="block text-sm font-medium text-black dark:text-white">
                                {parsed.name || 'Admin User'}
                            </span>
                            <span className="block text-xs">
                                {userRole === 'super_admin' ? 'Super Admin' : (parsed.role_rel?.name || 'Staff')}
                            </span>
                        </span>

                        <span className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                            {/* Placeholder Avatar */}
                            <img src={`https://ui-avatars.com/api/?name=${parsed.name || 'Admin'}&background=random`} alt="User" />
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
