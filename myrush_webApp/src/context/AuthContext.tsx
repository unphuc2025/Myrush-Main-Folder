import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

interface AuthContextType {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthModalOpen: boolean;
    openAuthModal: () => void;
    closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<any | null>(null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // Fetch user profile when token is present
            // apiClient already has interceptors to add token!
            apiClient.get('/profile/me')
                .then(res => {
                    if (res.data) setUser(res.data);
                })
                .catch(err => console.error("Failed to fetch user profile", err));

        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const login = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
    }, []);

    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
    const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated: !!token, 
            token, 
            user, 
            login, 
            logout,
            isAuthModalOpen,
            openAuthModal,
            closeAuthModal
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
