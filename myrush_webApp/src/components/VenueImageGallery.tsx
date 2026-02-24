import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface VenueImageGalleryProps {
    photos: string[];
    venueName: string;
}

export const VenueImageGallery: React.FC<VenueImageGalleryProps> = ({ photos, venueName }) => {
    const [activeIndex, setActiveIndex] = useState(0);
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

                // Keep the active element centered if possible
                const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);

                container.scrollTo({
                    top: scrollTo,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeIndex]);

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-[300px] sm:h-[400px] md:h-[500px] w-full">
            {/* Main Preview (Left) */}
            <div className="relative flex-1 group overflow-hidden rounded-2xl bg-gray-100 shadow-md">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={activeIndex}
                        src={currentPhotos[activeIndex]}
                        alt={`${venueName} - View ${activeIndex + 1}`}
                        className="w-full h-full object-cover"
                        loading="eager"
                        // @ts-ignore - fetchPriority is supported in modern browsers
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
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-primary' : 'bg-white/30 backdrop-blur-sm'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Thumbnail Sidebar (Right) */}
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
                        <img
                            src={photo}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />
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
                        className={`relative flex-shrink-0 flex-1 min-w-[80px] cursor-pointer rounded-lg overflow-hidden aspect-[4/3] transition-all duration-300 border-2 ${idx === activeIndex ? 'border-primary' : 'border-transparent'
                            }`}
                    >
                        <img
                            src={photo}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
