import React from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaStar, FaFutbol, FaParking, FaSwimmer, FaCoffee } from 'react-icons/fa';

interface VenueDetailCardProps {
    venue: any;
    onBookClick: (venueId: string) => void;
}

const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('parking')) return <FaParking className="text-blue-500" />;
    if (lower.includes('cafe') || lower.includes('food')) return <FaCoffee className="text-yellow-600" />;
    if (lower.includes('swim') || lower.includes('pool')) return <FaSwimmer className="text-cyan-500" />;
    return <FaFutbol className="text-primary/70" />;
};

export const VenueDetailCard: React.FC<VenueDetailCardProps> = ({ venue, onBookClick }) => {

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden my-2"
        >
            {/* Image Section */}
            <div className="relative h-48 bg-gray-200">
                {venue.images && venue.images.length > 0 ? (
                    <img
                        src={venue.images[0]}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <FaFutbol size={40} />
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm flex items-center gap-1">
                    <FaStar className="text-yellow-400" />
                    <span>4.5</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{venue.name}</h3>

                <div className="flex items-start gap-2 text-xs text-gray-500 mb-3">
                    <FaMapMarkerAlt className="mt-0.5 flex-shrink-0 text-primary" />
                    <span className="line-clamp-1">{venue.area}, {venue.city}</span>
                </div>

                {/* Sports Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {venue.game_types.slice(0, 3).map((sport: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold tracking-wider rounded-md">
                            {sport.name || sport}
                        </span>
                    ))}
                    {venue.game_types.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-md">
                            +{venue.game_types.length - 3}
                        </span>
                    )}
                </div>

                {/* Amenities Preview */}
                <div className="flex items-center gap-3 mb-4 py-2 border-y border-gray-50">
                    {venue.amenities.slice(0, 4).map((amenity: any, idx: number) => (
                        <div key={idx} className="flex flex-col items-center gap-1" title={amenity.name || amenity}>
                            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-xs">
                                {getAmenityIcon(amenity.name || amenity)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between mt-2">
                    <div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Starting from</p>
                        <p className="text-lg font-bold text-primary">
                            ₹{venue.price_range?.min || '500'}
                            <span className="text-xs text-gray-400 font-normal ml-0.5">/hr</span>
                        </p>
                    </div>

                    <button
                        onClick={() => onBookClick(venue.id)}
                        className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors active:scale-95"
                    >
                        Book Now
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
