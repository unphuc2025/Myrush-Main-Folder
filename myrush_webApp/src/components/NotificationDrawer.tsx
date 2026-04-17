import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheckDouble, FaDesktop } from 'react-icons/fa';
import { notificationApi } from '../services/notificationApi';
import type { Notification } from '../services/notificationApi';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { requestForToken, onMessageListener } from '../firebase';

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onUnreadChange: (count: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onUnreadChange }) => {
    const { isAuthenticated, token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await notificationApi.getInbox();
            const items = res?.items || [];
            const unread = res?.unread_count || 0;
            
            setNotifications(items);
            setUnreadCount(unread);
            onUnreadChange(unread);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, onUnreadChange]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            // Check current permission
            if ('Notification' in window) {
                setPushEnabled(Notification.permission === 'granted');
            }
        }
    }, [isOpen, fetchNotifications]);

    // Handle foreground FCM messages
    useEffect(() => {
        onMessageListener().then((payload) => {
            console.log('FCM Foreground Message:', payload);
            fetchNotifications();
        }).catch(err => console.log('FCM Listener Error:', err));
    }, [fetchNotifications]);

    const handleEnablePush = async () => {
        const fcmToken = await requestForToken();
        if (fcmToken) {
            try {
                await notificationApi.registerToken(fcmToken, 'web');
                setPushEnabled(true);
                alert('Success! Desktop alerts enabled.');
            } catch (err) {
                console.error('Failed to register FCM token:', err);
            }
        }
    };

    // WebSocket Integration for Real-Time
    useEffect(() => {
        if (!token || !isAuthenticated) return;

        const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
        const socket = new WebSocket(`${WS_URL}/ws?token=${token}`);

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.event === 'notification') {
                    const newNotif = payload.data;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    onUnreadChange(unreadCount + 1);
                }
            } catch (e) {
                console.error('WS Message Parse Error:', e);
            }
        };

        return () => socket.close();
    }, [token, isAuthenticated, unreadCount, onUnreadChange]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            const newCount = Math.max(0, unreadCount - 1);
            setUnreadCount(newCount);
            onUnreadChange(newCount);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            onUnreadChange(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[10001] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 bg-white sticky top-0">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="bg-primary text-black text-xs px-2 py-0.5 rounded-full">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 font-medium">Keep up with your activity</p>
                                {!pushEnabled && (
                                    <button 
                                        onClick={handleEnablePush}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-primary hover:text-black transition-all"
                                    >
                                        <FaDesktop size={10} />
                                        Enable Desktop Alerts
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        {notifications.length > 0 && (
                            <div className="px-6 py-3 bg-gray-50 flex justify-end">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-bold text-primary flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                                >
                                    <FaCheckDouble size={12} />
                                    Mark all as read
                                </button>
                            </div>
                        )}

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-4">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-gray-400">Loading your inbox...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-80 text-center px-10">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                        <FaBell size={32} className="text-gray-200" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900">All caught up!</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-2">
                                        We'll notify you here when there's an update on your bookings or games.
                                    </p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                        className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                                            notification.is_read
                                                ? 'bg-white border-gray-100 opacity-60'
                                                : 'bg-primary/5 border-primary/20 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${notification.is_read ? 'bg-transparent' : 'bg-primary shadow-[0_0_8px_rgba(255,214,0,0.8)]'}`} />
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-black leading-tight ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                                                    {notification.body}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                                    {formatDistanceToNow(new Date(notification.created_at.endsWith('Z') ? notification.created_at : notification.created_at + 'Z'), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
