import { X } from 'lucide-react';
import { useEffect } from 'react';

function Drawer({ title, children, onClose, isOpen }) {
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Drawer Panel */}
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
                    <div className="pointer-events-auto w-screen max-w-md transform transition-transform duration-300 ease-in-out bg-white shadow-2xl">
                        <div className="flex h-full flex-col overflow-y-scroll bg-white">
                            {/* Header */}
                            <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                                <button
                                    type="button"
                                    className="rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 p-2 transition-colors focus:outline-none"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close panel</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="relative mt-6 flex-1 px-6 sm:px-6">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Drawer;
