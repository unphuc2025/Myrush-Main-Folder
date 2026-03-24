import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import type { NotificationType } from '../../types/notification';

interface CustomNotificationProps {
    message: string;
    type: NotificationType;
    isConfirm: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export const CustomNotification: React.FC<CustomNotificationProps> = ({
    message,
    type,
    isConfirm,
    onClose,
    onConfirm,
    onCancel,
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <FaCheckCircle className="text-primary text-5xl mb-4" />;
            case 'error': return <FaExclamationCircle className="text-red-500 text-5xl mb-4" />;
            case 'warning': return <FaExclamationTriangle className="text-yellow-500 text-5xl mb-4" />;
            default: return <FaInfoCircle className="text-blue-500 text-5xl mb-4" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return 'border-primary/20';
            case 'error': return 'border-red-500/20';
            case 'warning': return 'border-yellow-500/20';
            default: return 'border-blue-500/20';
        }
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={isConfirm ? undefined : onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border ${getColors()} overflow-hidden`}
            >
                {/* Close button for non-confirm alerts */}
                {!isConfirm && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                )}

                <div className="flex flex-col items-center text-center">
                    {getIcon()}
                    
                    <h3 className="text-2xl font-black text-black mb-4 uppercase tracking-tight">
                        {type === 'success' ? 'Success!' : type === 'error' ? 'Oops!' : type === 'warning' ? 'Wait!' : 'Notice'}
                    </h3>
                    
                    <p className="text-gray-600 text-lg leading-relaxed font-medium mb-8">
                        {message}
                    </p>

                    <div className="flex gap-4 w-full">
                        {isConfirm ? (
                            <>
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 text-black font-bold hover:bg-gray-200 transition-all uppercase tracking-wider text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 py-4 px-6 rounded-2xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all uppercase tracking-wider text-sm"
                                >
                                    Confirm
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full py-4 px-6 rounded-2xl bg-black text-white font-bold hover:bg-gray-900 shadow-xl transition-all uppercase tracking-wider text-sm"
                            >
                                Got it
                            </button>
                        )}
                    </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            </motion.div>
        </div>
    );
};
