import React from 'react';
import { Bell, Search, Mail, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
    const adminInfo = localStorage.getItem('admin_info');
    const parsed = adminInfo ? JSON.parse(adminInfo) : {};
    const userRole = parsed.role || 'super_admin';

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

                    <Link className="block flex-shrink-0 lg:hidden" to="/">
                        {/* Mobile Logo Placeholder */}
                        <span className="font-bold text-lg text-primary">Admin</span>
                    </Link>
                </div>

                <div className="hidden sm:block">
                    <form action="#" method="POST">
                        <div className="relative">
                            <button className="absolute left-0 top-1/2 -translate-y-1/2">
                                <Search className="h-5 w-5 text-bodydark2 hover:text-primary" />
                            </button>

                            <input
                                type="text"
                                placeholder="Type to search..."
                                className="w-full bg-transparent pl-9 pr-4 text-black focus:outline-none dark:text-white xl:w-125"
                            />
                        </div>
                    </form>
                </div>

                <div className="flex items-center gap-3 2xsm:gap-7">
                    <ul className="flex items-center gap-2 2xsm:gap-4">
                        {/* Notification Bell Area - Simplified for now */}
                        {/*<li className="relative">
                            <Link
                                to="#"
                                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
                            >
                                <Bell className="h-4 w-4 duration-300 ease-in-out" />
                                <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-meta-1">
                                    <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
                                </span>
                            </Link>
                        </li>*/}
                    </ul>

                    {/* User Area */}
                    <div className="relative flex items-center gap-4">
                        <span className="hidden text-right lg:block">
                            <span className="block text-sm font-medium text-black dark:text-white">
                                {parsed.name || 'Admin User'}
                            </span>
                            <span className="block text-xs">
                                {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
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
