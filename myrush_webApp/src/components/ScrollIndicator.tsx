import React from 'react';
import './ScrollIndicator.css';

interface ScrollIndicatorProps {
    className?: string;
    style?: React.CSSProperties;
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ className, style }) => {
    return (
        <div className={`scroll-indicator-container ${className || ''}`} style={style}>
            <span className="scroll-text">SCROLL</span>
            <div className="scroll-line"></div>
        </div>
    );
};

export default ScrollIndicator;
