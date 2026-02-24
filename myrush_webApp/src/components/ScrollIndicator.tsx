import React from 'react';
import './ScrollIndicator.css';

const ScrollIndicator: React.FC = () => {
    return (
        <div className="scroll-indicator-container">
            <span className="scroll-text">SCROLL</span>
            <div className="scroll-line"></div>
        </div>
    );
};

export default ScrollIndicator;
