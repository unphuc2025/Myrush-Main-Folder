import React, { useState, useEffect } from 'react';
import { BellRing, X, Monitor, ChevronRight } from 'lucide-react';
import { requestForToken } from '../firebase';
import { notificationApi } from '../services/notificationApi';

const NotificationPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(sessionStorage.getItem('notif_prompt_dismissed') === 'true');

    useEffect(() => {
        // Only show if not dismissed in this session AND permission is default
        if (!isDismissed && Notification.permission === 'default') {
            setIsVisible(true);
        }
    }, [isDismissed]);

    const handleEnable = async () => {
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
                setIsVisible(false);
                // Permanent dismissal for this session once enabled
                sessionStorage.setItem('notif_prompt_dismissed', 'true');
            } catch (error) {
                console.error('Failed to register push token from prompt:', error);
            }
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        sessionStorage.setItem('notif_prompt_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="mx-auto max-w-screen-2xl px-4 md:px-6 2xl:px-10 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 p-[1px] shadow-lg shadow-indigo-200/50">
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 dark:bg-boxdark group-hover:bg-white/95 transition-all">
                    
                    {/* Icon & Text */}
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner">
                            <Monitor className="h-6 w-6 animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-tight">Stay ahead of every booking</h4>
                            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                                Enable OS-level desktop alerts to receive real-time updates even when the dashboard is closed.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleEnable}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
                        >
                            Enable Alerts
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        
                        <button
                            onClick={handleDismiss}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                            title="Dismiss for this session"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Subtle Background Glow */}
                    <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl transition-all group-hover:bg-emerald-400/20"></div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPrompt;
