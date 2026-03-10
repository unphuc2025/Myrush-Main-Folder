import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface VenueImageGalleryProps {
    photos: string[];
    venueName: string;
    virtualTourUrl?: string; // optional — only shown when provided
}

export const VenueImageGallery: React.FC<VenueImageGalleryProps> = ({ photos, venueName, virtualTourUrl }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'photos' | 'tour'>(virtualTourUrl ? 'tour' : 'photos');
    const thumbnailContainerRef = useRef<HTMLDivElement>(null);
    const thumbnailRefs = useRef<(HTMLDivElement | null)[]>([]);

    const totalPhotos = photos.length > 0 ? photos.length : 1;
    const currentPhotos = photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076'];

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % totalPhotos);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
    };

    const handleThumbnailClick = (index: number) => {
        setActiveIndex(index);
    };

    // Auto-scroll logic for thumbnails
    useEffect(() => {
        if (thumbnailRefs.current[activeIndex] && thumbnailContainerRef.current) {
            const container = thumbnailContainerRef.current;
            const element = thumbnailRefs.current[activeIndex];

            if (element) {
                const containerHeight = container.offsetHeight;
                const elementTop = element.offsetTop;
                const elementHeight = element.offsetHeight;
                const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
                container.scrollTo({ top: scrollTo, behavior: 'smooth' });
            }
        }
    }, [activeIndex]);

    return (
        <div className="flex flex-col gap-0 w-full">
            {/* Tab switcher — only shown when virtualTourUrl is provided */}
            {virtualTourUrl && (
                <div className="flex gap-1 mb-3 bg-gray-100 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setActiveTab('tour')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'tour'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        360° Virtual Tour
                    </button>
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'photos'
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Photos
                    </button>
                </div>
            )}

            {/* Content area */}
            {activeTab === 'tour' && virtualTourUrl ? (
                /* Virtual Tour iframe */
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-md" style={{ height: '500px' }}>
                    <div className="w-full h-9 bg-gray-900 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            <span className="ml-2 text-xs text-gray-400 font-semibold">360° Virtual Tour — {venueName}</span>
                        </div>
                        <a
                            href={virtualTourUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                            title="Open full screen"
                        >
                            ↗ Full Screen
                        </a>
                    </div>
                    <iframe
                        src={virtualTourUrl}
                        title={`${venueName} — 360° Virtual Tour`}
                        width="100%"
                        style={{ height: 'calc(100% - 36px)', border: 0 }}
                        allow="fullscreen; accelerometer; gyroscope"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            ) : (
                /* Photo Gallery */
                <div className="flex flex-col lg:flex-row gap-4 h-[300px] sm:h-[400px] md:h-[500px] w-full">
                    {/* Main Preview */}
                    <div className="relative flex-1 group overflow-hidden rounded-2xl bg-gray-100 shadow-md">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={activeIndex}
                                src={currentPhotos[activeIndex]}
                                alt={`${venueName} - View ${activeIndex + 1}`}
                                className="w-full h-full object-cover"
                                loading="eager"
                                // @ts-ignore
                                fetchPriority="high"
                                style={{
                                    imageRendering: 'auto',
                                    transform: 'translateZ(0)',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden'
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            />
                        </AnimatePresence>

                        {/* Navigation Arrows */}
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 border border-white/20 z-10"
                            aria-label="Previous image"
                        >
                            <FaChevronLeft size={16} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 border border-white/20 z-10"
                            aria-label="Next image"
                        >
                            <FaChevronRight size={16} />
                        </button>

                        {/* Progress bar */}
                        <div className="absolute bottom-4 left-4 right-4 flex gap-1.5 z-10">
                            {currentPhotos.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-primary' : 'bg-white/30 backdrop-blur-sm'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Thumbnail Sidebar (Desktop) */}
                    <div
                        ref={thumbnailContainerRef}
                        className="hidden lg:flex flex-col gap-3 w-32 overflow-y-auto scrollbar-hide py-1 px-1 h-full"
                    >
                        {currentPhotos.map((photo, idx) => (
                            <motion.div
                                key={idx}
                                ref={(el) => { thumbnailRefs.current[idx] = el; }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleThumbnailClick(idx)}
                                className={`relative flex-shrink-0 cursor-pointer rounded-xl overflow-hidden aspect-[4/3] w-full transition-all duration-300 shadow-sm border-2 ${idx === activeIndex
                                    ? 'border-primary shadow-glow ring-2 ring-primary/20'
                                    : 'border-transparent grayscale-[30%] hover:grayscale-0'
                                    }`}
                            >
                                <img src={photo} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                {idx === activeIndex && (
                                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile Thumbnails (Bottom) */}
                    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {currentPhotos.map((photo, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleThumbnailClick(idx)}
                                className={`relative flex-shrink-0 flex-1 min-w-[80px] cursor-pointer rounded-lg overflow-hidden aspect-[4/3] transition-all duration-300 border-2 ${idx === activeIndex ? 'border-primary' : 'border-transparent'}`}
                            >
                                <img src={photo} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
