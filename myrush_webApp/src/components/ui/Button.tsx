import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    icon,
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-heading font-black uppercase tracking-[0.1em] transition-all duration-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
        primary: "bg-primary text-black hover:bg-primary-hover shadow-[0_15px_30px_-5px_rgba(0,210,106,0.3)] hover:shadow-glow-strong border border-transparent",
        secondary: "bg-black text-white hover:bg-white hover:text-black border border-transparent shadow-premium hover:shadow-premium-hover",
        outline: "bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-black",
        ghost: "bg-transparent text-gray-400 hover:text-primary hover:bg-primary/5",
    };

    const sizes = {
        sm: "text-[10px] px-5 py-2.5",
        md: "text-xs px-8 py-4",
        lg: "text-sm px-12 py-5.5",
    };

    return (
        <motion.button
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
            ) : icon ? (
                <span className="mr-3 text-lg">{icon}</span>
            ) : null}
            {children}
        </motion.button>
    );
};
