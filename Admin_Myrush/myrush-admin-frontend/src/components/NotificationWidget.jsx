import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CalendarClock, CreditCard, AlertTriangle, X, CheckCheck, Monitor } from 'lucide-react';
import { notificationApi } from '../services/notificationApi';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { requestForToken, onMessageListener } from '../firebase';

const NotificationWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isPushEnabled, setIsPushEnabled] = useState(Notification.permission === 'granted');
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')); // Notification Ding

    const handleEnablePush = async () => {
        const token = await requestForToken();
        if (token) {
            try {
                await notificationApi.registerToken({
                    device_token: token,
                    device_type: 'web',
                    device_info: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform
                    }
                });
                setIsPushEnabled(true);
                alert('Desktop alerts enabled successfully! 🚀');
            } catch (error) {
                console.error('Failed to register push token:', error);
                alert('Failed to enable desktop alerts. Please try again.');
            }
        }
    };

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notificationApi.getInbox();
            setNotifications(data.items || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        
        // Auto-register FCM token if permission is already granted
        if (Notification.permission === 'granted') {
            const autoRegister = async () => {
                try {
                    const token = await requestForToken();
                    if (token) {
                        await notificationApi.registerToken({
                            device_token: token,
                            device_type: 'web',
                            device_info: {
                                userAgent: navigator.userAgent,
                                platform: navigator.platform
                            }
                        });
                        console.log('✅ Auto-registered admin FCM token');
                    }
                } catch (e) {
                    console.error('Failed to auto-register FCM token:', e);
                }
            };
            autoRegister();
        }
        
        // WebSocket for Real-Time
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
        const socket = new WebSocket(`${WS_URL}/ws?token=admin-token-${token.replace('admin-token-', '')}`);

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.event === 'notification') {
                    const newNotif = payload.data;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    
                    // Play sound
                    audioRef.current.play().catch(e => console.log('Audio autoplay blocked'));
                }
            } catch (e) {
                console.error('WS Parse error:', e);
            }
        };

        return () => socket.close();
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
        
        // Navigate based on type
        if (notification.type === 'booking_confirmed' || notification.type === 'new_booking_admin') {
            navigate('/bookings');
        }
        
        setIsOpen(false);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking_confirmed':
            case 'new_booking_admin':
            case 'booking_reminder':
                return { Icon: CalendarClock, color: 'text-blue-500', bgColor: 'bg-blue-50', iconBorder: 'border-blue-100' };
            case 'payment_failed':
                return { Icon: CreditCard, color: 'text-rose-500', bgColor: 'bg-rose-50', iconBorder: 'border-rose-100' };
            case 'booking_cancelled':
                return { Icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-50', iconBorder: 'border-amber-100' };
            case 'daily_summary_admin':
                return { Icon: CheckCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-50', iconBorder: 'border-emerald-100' };
            default:
                return { Icon: Bell, color: 'text-primary', bgColor: 'bg-yellow-50', iconBorder: 'border-yellow-100' };
        }
    };

    return (
        <li className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white hover:bg-gray-2 shadow-sm transition-all dark:border-strokedark dark:bg-meta-4 dark:text-white"
            >
                <Bell className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'scale-110' : ''} ${unreadCount > 0 ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-meta-1 border-2 border-white"></span>
                    </span>
                )}
            </button>

            {/* Premium Dropdown Menu */}
            {isOpen && (
                <div 
                    className="absolute right-0 mt-3 flex h-[520px] w-96 flex-col rounded-2xl border border-stroke bg-white/95 backdrop-blur-xl shadow-2xl dark:border-strokedark dark:bg-boxdark/95 sm:w-[420px] overflow-hidden z-[999] animate-in fade-in zoom-in duration-200"
                    style={{ filter: 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))' }}
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-stroke dark:border-strokedark bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-meta-4/30 dark:to-boxdark/30">
                        <div className="flex justify-between items-center mb-1">
                            <div>
                                <h5 className="text-base font-extrabold text-black dark:text-white tracking-tight">
                                    Notifications
                                </h5>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-widest">
                                    MyRush Real-time Alert Center
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase">
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                            {!isPushEnabled && (
                                <button 
                                    onClick={handleEnablePush}
                                    className="flex-1 text-[10px] bg-white dark:bg-meta-4 text-slate-700 dark:text-white px-3 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-stroke dark:border-strokedark shadow-sm"
                                >
                                    <Monitor size={12} className="text-primary" />
                                    Desktop Alerts
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button 
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] bg-primary/10 text-primary px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/20 transition-all border border-primary/20"
                                >
                                    <CheckCheck size={12} />
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <ul className="flex flex-1 flex-col overflow-y-auto scrollbar-hide">
                        {loading && notifications.length === 0 ? (
                            <li className="px-4 py-20 text-center flex flex-col items-center justify-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <Bell className="absolute inset-0 m-auto h-4 w-4 text-primary/40" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Updating Inbox...</span>
                            </li>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const { Icon, color, bgColor, iconBorder } = getIcon(notification.type);
                                return (
                                    <li key={notification.id} className="group relative">
                                        <button
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`flex w-full items-start gap-4 px-6 py-5 hover:bg-slate-50/80 dark:hover:bg-meta-4/20 transition-all text-left relative ${!notification.is_read ? 'bg-primary/[0.02]' : ''}`}
                                        >
                                            <div className="relative">
                                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${iconBorder} ${bgColor} ${color} shadow-sm group-hover:scale-105 transition-transform`}>
                                                    <Icon className="h-5.5 w-5.5" />
                                                </div>
                                                {!notification.is_read && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-white dark:border-boxdark"></span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <p className={`text-[13px] leading-tight break-words line-clamp-2 ${!notification.is_read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-600 dark:text-slate-400'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap bg-slate-100 dark:bg-meta-4/30 px-1.5 py-0.5 rounded uppercase">
                                                        {formatDistanceToNow(new Date(notification.created_at.endsWith('Z') ? notification.created_at : notification.created_at + 'Z'), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">
                                                    {notification.body}
                                                </p>
                                                {!notification.is_read && (
                                                    <div className="mt-2 text-[10px] font-black text-primary uppercase tracking-tighter flex items-center gap-1">
                                                        <span className="w-1 h-1 bg-primary rounded-full"></span>
                                                        New Activity
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                        <div className="absolute bottom-0 left-6 right-6 h-[0.5px] bg-slate-100 dark:bg-strokedark group-last:hidden"></div>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-6 py-20 text-center text-sm flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-4">
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-meta-4/20 rounded-full flex items-center justify-center blur-none">
                                        <Bell className="h-10 w-10 text-slate-200 dark:text-slate-700" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-boxdark p-2 rounded-xl shadow-lg border border-stroke dark:border-strokedark">
                                        <CheckCheck className="text-emerald-500 h-5 w-5" />
                                    </div>
                                </div>
                                <h6 className="text-base font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Inbox is Empty</h6>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold max-w-[240px] leading-relaxed">
                                    You're all caught up! New bookings and alerts will appear here in real-time.
                                </p>
                            </li>
                        )}
                    </ul>
                    
                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-4 bg-slate-50/50 dark:bg-meta-4/10 border-t border-stroke dark:border-strokedark text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                END OF ALERTS
                            </p>
                        </div>
                    )}
                </div>
            )}
        </li>
    );
};

export default NotificationWidget;
