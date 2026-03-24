import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CustomNotification } from '../components/ui/CustomNotification';

import type { NotificationType } from '../types/notification';

interface NotificationState {
    isOpen: boolean;
    message: string;
    type: NotificationType;
    isConfirm: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface NotificationContextType {
    showAlert: (message: string, type?: NotificationType) => void;
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
    closeNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<NotificationState>({
        isOpen: false,
        message: '',
        type: 'info',
        isConfirm: false,
    });

    const showAlert = useCallback((message: string, type: NotificationType = 'info') => {
        setState({
            isOpen: true,
            message,
            type,
            isConfirm: false,
        });
    }, []);

    const showConfirm = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
        setState({
            isOpen: true,
            message,
            type: 'warning',
            isConfirm: true,
            onConfirm,
            onCancel,
        });
    }, []);

    const closeNotification = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <NotificationContext.Provider value={{ showAlert, showConfirm, closeNotification }}>
            {children}
            <AnimatePresence>
                {state.isOpen && (
                    <CustomNotification
                        message={state.message}
                        type={state.type}
                        isConfirm={state.isConfirm}
                        onClose={closeNotification}
                        onConfirm={() => {
                            state.onConfirm?.();
                            closeNotification();
                        }}
                        onCancel={() => {
                            state.onCancel?.();
                            closeNotification();
                        }}
                    />
                )}
            </AnimatePresence>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
