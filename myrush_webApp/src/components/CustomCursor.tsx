import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const isDarkOrGreen = (color: string) => {
    if (!color || color === 'transparent' || color.includes('rgba(0, 0, 0, 0)')) return false;
    
    // getComputedStyle returns rgb() or rgba()
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return false;
    
    const [r, g, b, a] = rgb.map(Number);
    
    // If transparent (alpha 0)
    if (a === 0) return false;
    
    // Check if it's the primary green (#00D26A) or a strong green background
    const isGreen = r < 100 && g > 180 && b < 150;
    
    // Luma brightness calculation (Rec. 601)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return true if color is green or dark (brightness < 128)
    return isGreen || brightness < 128;
};

export const CustomCursor: React.FC = () => {
    const [isHovering, setIsHovering] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isContrast, setIsContrast] = useState(false);

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Spring configuration for the smooth lag effect
    // Spring configuration - Much tighter and faster for more "natural" feel
    const springConfig = { damping: 30, stiffness: 450, mass: 0.5 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
            
            // Contrast detection moved to handleMouseOver for performance
        };

        const handleMouseDown = () => setIsClicked(true);
        const handleMouseUp = () => setIsClicked(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target) return;

            const isInteractive =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('button') ||
                target.closest('a') ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isInteractive);

            // Update contrast state only when mouse moves to a new element
            const style = window.getComputedStyle(target);
            const bgColor = style.backgroundColor;
            setIsContrast(isDarkOrGreen(bgColor));
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', moveMouse, { passive: true });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', moveMouse);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [mouseX, mouseY, isVisible]);

    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
        return null; // Don't show on touch devices
    }

    const primaryColor = 'rgba(0, 210, 106, 1)'; // #00D26A
    const contrastColor = 'rgba(255, 255, 255, 0.9)'; // White/Light
    const primaryTransparent = 'rgba(0, 210, 106, 0.4)';
    const contrastTransparent = 'rgba(255, 255, 255, 0.3)';

    return (
        <div className="fixed inset-0 pointer-events-none z-[99999]">
            {/* Outer Circle Outline */}
            <motion.div
                className="fixed top-0 left-0 w-8 h-8 border-2 rounded-full will-change-transform"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%',
                    opacity: isVisible ? 1 : 0,
                    borderColor: isContrast ? contrastColor : primaryColor,
                }}
                animate={{
                    scale: isHovering ? 1.5 : (isClicked ? 0.8 : 1),
                    borderColor: isHovering
                        ? (isContrast ? contrastTransparent : primaryTransparent)
                        : (isContrast ? contrastColor : primaryColor),
                    backgroundColor: isHovering
                        ? (isContrast ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 210, 106, 0.1)')
                        : 'transparent',
                }}
                transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 400,
                    borderColor: { duration: 0.2 },
                    backgroundColor: { duration: 0.2 }
                }}
            />

            {/* Inner Dot */}
            <motion.div
                className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full will-change-transform"
                style={{
                    x: mouseX, 
                    y: mouseY,
                    translateX: '-50%',
                    translateY: '-50%',
                    opacity: isVisible ? 1 : 0,
                    backgroundColor: isContrast ? contrastColor : primaryColor,
                }}
                animate={{
                    scale: isHovering ? 0 : (isClicked ? 1.5 : 1),
                    backgroundColor: isContrast ? contrastColor : primaryColor,
                }}
                transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 800,
                    backgroundColor: { duration: 0.2 }
                }}
            />
        </div>
    );
};
