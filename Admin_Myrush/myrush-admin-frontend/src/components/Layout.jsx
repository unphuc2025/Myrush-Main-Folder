import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { adminsApi } from '../services/adminApi';

const Layout = ({ children, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Refresh admin_info from the backend on every page load so sub-admin permissions
    // are always up-to-date, even after a super-admin updates a role.
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        adminsApi.getMe()
            .then(freshAdminInfo => {
                localStorage.setItem('admin_info', JSON.stringify(freshAdminInfo));
                window.dispatchEvent(new Event('admin-info-updated'));
            })
            .catch(() => {
                // Silently ignore — stale data is better than a crash
            });
    }, []);

    return (
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
            <div className="flex h-screen overflow-hidden">
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onLogout={onLogout} />

                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                    <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                    <main>
                        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;
