import React from 'react';
import { Bell, Search, Mail, Power, Menu } from 'lucide-react';

const Header = () => {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-8 shadow-sm border-b border-gray-100 transition-all">
            <div className="flex items-center gap-6">
                <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-purple-600 transition-all">
                    <Menu className="h-6 w-6" />
                </button>

                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search projects, venues..."
                        className="h-10 w-80 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition-all focus:border-purple-300 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    />
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex items-center gap-4">
                    <button className="group relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-all">
                        <Mail className="h-5 w-5 group-hover:text-purple-600 transition-colors" />
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-purple-500 shadow-lg shadow-purple-200 ring-2 ring-white"></span>
                    </button>
                    <button className="group relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-all">
                        <Bell className="h-5 w-5 group-hover:text-purple-600 transition-colors" />
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-lg shadow-red-200 ring-2 ring-white"></span>
                    </button>
                </div>

                <div className="h-8 border-r border-gray-200"></div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                alt="Profile"
                                className="h-10 w-10 rounded-lg object-cover border-2 border-purple-100"
                            />
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-semibold text-gray-900">David Greymaax</p>
                            <p className="text-xs text-gray-500">Admin</p>
                        </div>
                    </div>

                    <button className="rounded-lg p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
                        <Power className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
