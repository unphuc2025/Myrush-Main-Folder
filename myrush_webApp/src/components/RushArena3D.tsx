import React, { useState } from 'react';

export const RushArena3D: React.FC<{ url?: string }> = ({ url = "https://rush-arena-bcu.talkinglands.studio/" }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Reset loading state when URL changes to show the loader again
    React.useEffect(() => {
        setIsLoading(true);
    }, [url]);

    return (
        <div className="relative w-full h-full bg-black">
            <iframe
                key={url} // Force reload when URL changes
                src={url}
                title="Rush Arena 3D Experience"
                className="absolute top-0 left-0 w-full h-full"
                style={{ border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsLoading(false)}
            />

            {/* Loading overlay - fades out when loaded */}
            <div
                className={`absolute inset-0 bg-black flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <div className="text-primary text-lg font-bold uppercase tracking-widest animate-pulse">Loading Arena...</div>
                </div>
            </div>


        </div>
    );
};
