import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const CustomCursor: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Track mouse position
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Smooth movement with springs
    const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseDown = () => setIsActive(true);
        const handleMouseUp = () => setIsActive(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Detect clickable elements
            const isClickable = 
                target.onclick || 
                target.tagName === 'BUTTON' || 
                target.tagName === 'A' || 
                target.closest('button') || 
                target.closest('a') ||
                window.getComputedStyle(target).cursor === 'pointer';
            
            setIsHovered(!!isClickable);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
            removeHiddenStyle();
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
            applyHiddenStyle();
        };

        // DOM element for dynamic style
        let styleElement: HTMLStyleElement | null = null;

        const applyHiddenStyle = () => {
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'cursor-hide-rules';
                styleElement.innerHTML = `* { cursor: none !important; }`;
                document.head.appendChild(styleElement);
            }
        };

        const removeHiddenStyle = () => {
            if (styleElement) {
                styleElement.remove();
                styleElement = null;
            }
            // Cleanup in case of orphans
            const orphan = document.getElementById('cursor-hide-rules');
            if (orphan) orphan.remove();
        };

        const handleBlur = () => {
            setIsVisible(false);
            removeHiddenStyle();
        };

        const handleFocus = () => {
            // Restore handled by mouse move
        };

        window.addEventListener('mousemove', moveMouse, { passive: true });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseover', handleMouseOver);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', moveMouse);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            removeHiddenStyle();
        };
    }, []); // Only run once on mount

    // Supplemental Effect for visibility logic
    useEffect(() => {
        const styleId = 'cursor-hide-rules';
        if (isVisible) {
            if (!document.getElementById(styleId)) {
                const s = document.createElement('style');
                s.id = styleId;
                s.innerHTML = `* { cursor: none !important; }`;
                document.head.appendChild(s);
            }
        } else {
            const s = document.getElementById(styleId);
            if (s) s.remove();
        }
    }, [isVisible]);

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null; // Don't show on touch devices
    }

    const primaryColor = 'rgba(0, 210, 106, 1)'; // #00D26A
    const contrastColor = 'rgba(255, 255, 255, 0.9)'; // White/Light

    return (
        <div className="fixed inset-0 pointer-events-none z-[99999] custom-cursor-element">
            {/* Outer Circle Outline */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 border-2 rounded-full will-change-transform"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    borderColor: isHovered ? primaryColor : contrastColor,
                    scale: isActive ? 0.8 : (isHovered ? 1.5 : 1),
                    opacity: isVisible ? 1 : 0,
                    boxShadow: isHovered ? `0 0 15px ${primaryColor}` : 'none',
                }}
            />

            {/* Inner Glowing Dot */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 rounded-full will-change-transform"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    backgroundColor: primaryColor,
                    opacity: isVisible ? 1 : 0,
                    scale: isActive ? 1.2 : 1,
                    boxShadow: `0 0 10px ${primaryColor}, 0 0 20px ${primaryColor}`,
                }}
            />
            
            {/* Trailing Glow Effect */}
            <motion.div
                className="fixed top-0 left-0 w-12 h-12 rounded-full pointer-events-none will-change-transform"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    background: `radial-gradient(circle, ${primaryColor.replace('1)', '0.15)')} 0%, transparent 70%)`,
                    opacity: isVisible ? (isHovered ? 0.8 : 0.4) : 0,
                    scale: isHovered ? 2 : 1,
                }}
            />
        </div>
    );
};
