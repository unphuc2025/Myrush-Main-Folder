import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-black uppercase tracking-widest text-white mb-3 ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    className={`
                        w-full 
                        ${icon ? 'pl-14' : 'pl-6'} 
                        pr-6 h-16 
                        bg-white/10 
                        backdrop-blur-md
                        border border-white/20 
                        rounded-2xl 
                        text-white 
                        placeholder-white/30 
                        focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 
                        transition-all duration-300 
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        ${error ? 'border-danger focus:ring-danger/20' : ''}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-2 ml-1 text-xs font-bold text-danger">{error}</p>
            )}
        </div>
    );
};
