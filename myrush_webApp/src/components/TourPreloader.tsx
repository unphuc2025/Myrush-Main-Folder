import React from 'react';

/**
 * Unique Talking Lands URLs to preload globally.
 * These are collected from Arena.tsx and VenueDetails.tsx.
 */
const TOUR_URLS = [
    'https://rush-arena.talkinglands.studio/',
    'https://rush-arena-bcu.talkinglands.studio/',
    'https://rush-arena-cooke-town.talkinglands.studio/',
    'https://rush-arena-gtmall.talkinglands.studio/',
    'https://rush-arena-rj.talkinglands.studio/',
];

/**
 * TourPreloader component
 * Renders invisible iframes at the root level to trigger browser caching and initialization.
 */
export const TourPreloader: React.FC = () => {
    return (
        <div 
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: 0, 
                height: 0, 
                overflow: 'hidden', 
                visibility: 'hidden', 
                pointerEvents: 'none',
                zIndex: -9999
            }}
            aria-hidden="true"
        >
            {TOUR_URLS.map((url) => (
                <iframe 
                    key={url} 
                    src={url} 
                    title="Preload Tour" 
                    width="1" 
                    height="1" 
                    style={{ border: 0 }}
                    allow="accelerometer; gyroscope"
                />
            ))}
        </div>
    );
};
