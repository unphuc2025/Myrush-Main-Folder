import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const CustomCursor: React.FC = () => {
    const [isHovering, setIsHovering] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isContrast, setIsContrast] = useState(false);

    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Spring configuration for the smooth lag effect
    const springConfig = { damping: 25, stiffness: 250 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const isDarkOrGreen = (color: string) => {
            if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return false;

            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);

                // Luma calculation for brightness
                const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                // Green detection: High green component relative to others
                const isGreenish = g > 130 && g > r * 1.1 && g > b * 1.2;

                // Return true if dark (luma < 140) or if it's a green shade
                return luma < 140 || isGreenish;
            }
            return false;
        };

        const moveMouse = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);

            // Check element at cursor position for contrast
            const element = document.elementFromPoint(e.clientX, e.clientY);
            if (element) {
                const style = window.getComputedStyle(element);
                const bgColor = style.backgroundColor;
                setIsContrast(isDarkOrGreen(bgColor));
            }
        };

        const handleMouseDown = () => setIsClicked(true);
        const handleMouseUp = () => setIsClicked(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isInteractive =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('button') ||
                target.closest('a') ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isInteractive);
        };

        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', moveMouse);
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
                className="fixed top-0 left-0 w-8 h-8 border-2 rounded-full"
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
                    damping: 20,
                    stiffness: 300,
                    borderColor: { duration: 0.2 },
                    backgroundColor: { duration: 0.2 }
                }}
            />

            {/* Inner Dot */}
            <motion.div
                className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full"
                style={{
                    x: mouseX, // Inner dot follows immediately for precision
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
                    backgroundColor: { duration: 0.2 }
                }}
            />
        </div>
    );
};
