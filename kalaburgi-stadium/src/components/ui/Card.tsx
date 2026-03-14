import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    variant?: 'default' | 'glass';
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    noPadding = false,
    className = '',
    ...props
}) => {
    const baseStyles = "rounded-xl overflow-hidden transition-all duration-500 ease-out";

    const variants = {
        default: "bg-white shadow-premium hover:shadow-premium-hover border border-gray-100",
        glass: "bg-white/10 backdrop-blur-xl border border-white/20 shadow-premium hover:bg-white/15",
    };

    const padding = noPadding ? "" : "p-10 md:p-12";

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -10 }}
            viewport={{ once: true }}
            className={`${baseStyles} ${variants[variant]} ${padding} ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};
