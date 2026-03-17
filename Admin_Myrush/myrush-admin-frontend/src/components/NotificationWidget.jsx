import React, { useState, useEffect, useRef } from 'react';
import { Bell, CalendarClock, CreditCard, AlertTriangle, X } from 'lucide-react';
import { bookingsApi } from '../services/adminApi';
import { useNavigate } from 'react-router-dom';

const NotificationWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        
        // Polling every 5 minutes (300000 ms)
        const interval = setInterval(fetchNotifications, 300000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await bookingsApi.getAll();
            const allBookings = data?.items || data || [];
            
            const newNotifications = generateNotifications(allBookings);
            setNotifications(newNotifications);
            setUnreadCount(newNotifications.filter(n => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateNotifications = (bookings) => {
        const generated = [];
        const now = new Date();

        bookings.forEach(booking => {
            // 1. Upcoming bookings starting soon (within next 2 hours)
            if (booking.status === 'confirmed') {
                const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time || '00:00'}`);
                const diffTime = Math.abs(bookingDateTime - now);
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60)); 
                
                if (diffHours <= 2 && bookingDateTime > now) {
                    generated.push({
                        id: `upcoming-${booking.id}`,
                        type: 'upcoming',
                        title: 'Upcoming Booking',
                        message: `${booking.customer_name} at ${booking.court?.branch?.name} starts soon.`,
                        time: bookingDateTime,
                        read: false,
                        link: '/bookings',
                        icon: CalendarClock,
                        color: 'text-blue-500',
                        bgColor: 'bg-blue-100'
                    });
                }
            }

            // 2. Failed or pending online payments (Created in last 24h)
            if (['pending', 'failed'].includes(booking.payment_status?.toLowerCase())) {
                const createdDate = new Date(booking.created_at || booking.booking_date);
                const diffTime = Math.abs(now - createdDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays <= 1) {
                     generated.push({
                        id: `payment-${booking.id}`,
                        type: 'payment',
                        title: `Payment ${booking.payment_status}`,
                        message: `Payment is ${booking.payment_status} for ${booking.customer_name}.`,
                        time: createdDate,
                        read: false,
                        link: '/bookings',
                        icon: CreditCard,
                        color: booking.payment_status === 'failed' ? 'text-red-500' : 'text-yellow-500',
                        bgColor: booking.payment_status === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
                    });
                }
            }
        });

        // Sort by time descending
        return generated.sort((a, b) => b.time - a.time).slice(0, 10); // Keep max 10
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        navigate(notification.link);
        setIsOpen(false);
    };

    return (
        <li className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            >
                <Bell className="h-4 w-4 duration-300 ease-in-out" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-meta-1">
                        <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark sm:right-0 sm:w-80">
                    <div className="px-4 py-3 border-b border-stroke dark:border-strokedark flex justify-between items-center">
                        <h5 className="text-sm font-medium text-bodydark2">Notifications</h5>
                        {unreadCount > 0 && (
                            <span className="text-xs text-primary font-medium">{unreadCount} new</span>
                        )}
                    </div>

                    <ul className="flex h-auto flex-col overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <li className="px-4 py-3 text-center text-sm text-slate-500">Loading...</li>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const Icon = notification.icon;
                                return (
                                    <li key={notification.id}>
                                        <button
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`flex w-full items-start gap-3 border-b border-stroke px-4 py-3 hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4 ${!notification.read ? 'bg-slate-50' : ''}`}
                                        >
                                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${notification.bgColor} ${notification.color}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="text-left w-full">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className={`text-sm ${!notification.read ? 'font-semibold text-black dark:text-white' : 'font-medium text-black dark:text-white'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400">
                                                        {notification.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-bodydark2">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-4 py-6 text-center text-sm text-slate-500 flex flex-col items-center">
                                <Bell className="h-8 w-8 mb-2 text-slate-300" />
                                No new notifications
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </li>
    );
};

export default NotificationWidget;
