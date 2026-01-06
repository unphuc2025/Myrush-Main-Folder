import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, onLogout }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Sidebar onLogout={onLogout} />

            <div className="ml-48 transition-all duration-300">
                <Header />
                <main className="p-8">
                    <div className="mx-auto max-w-7xl animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
