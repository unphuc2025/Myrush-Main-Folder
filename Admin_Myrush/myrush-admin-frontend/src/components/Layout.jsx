import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { adminsApi } from '../services/adminApi';

const Layout = ({ children, onLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Centralized Authentication and Permission Synchronization
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        
        // 1. Redirect to login if no token is found (unless already on login page)
        if (!token && location.pathname !== '/login') {
            navigate('/login', { replace: true });
            return;
        }

        if (!token) return;

        // 2. Refresh admin_info from backend to ensure permissions are always up-to-date.
        // This is critical when a super-admin updates a role while the sub-admin is logged in.
        adminsApi.getMe()
            .then(freshAdminInfo => {
                localStorage.setItem('admin_info', JSON.stringify(freshAdminInfo));
                // Signal to components like Sidebar that permissions might have changed
                window.dispatchEvent(new Event('admin-info-updated'));
            })
            .catch((err) => {
                console.error("Layout: Session validation failed", err);
                // 3. If the token is invalid (401/403), force logout and redirect.
                if (err.status === 401 || err.status === 403) {
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_info');
                    navigate('/login', { replace: true });
                }
            });
    }, [location.pathname, navigate]);

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
