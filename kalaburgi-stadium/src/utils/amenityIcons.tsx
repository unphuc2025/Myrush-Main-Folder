
import {
    FaParking,
    FaWifi,
    FaShower,
    FaLightbulb,
    FaWater,
    FaCoffee,
    FaUtensils,
    FaFirstAid,
    FaVideo,
    FaSnowflake,
    FaUserTie,
    FaTshirt,
    FaLeaf,
    FaListOl,
    FaChair,
    FaBaby,
    FaCreditCard,
    FaLock,
    FaRestroom,
    FaQuestion
} from 'react-icons/fa';

export const getAmenityIcon = (name: string, className: string = "w-6 h-6") => {
    const n = name.toLowerCase();

    if (n.includes('park')) return <FaParking className={className} />;
    if (n.includes('wifi') || n.includes('wi-fi') || n.includes('internet')) return <FaWifi className={className} />;
    if (n.includes('toilet') || n.includes('washroom') || n.includes('restroom') || n.includes('wc')) return <FaRestroom className={className} />;
    if (n.includes('shower') || n.includes('bath')) return <FaShower className={className} />;
    if (n.includes('changing') || n.includes('locker') || n.includes('dressing')) return <FaLock className={className} />;
    if (n.includes('flood') || n.includes('light') || n.includes('lamp')) return <FaLightbulb className={className} />;
    if (n.includes('drink') || n.includes('water')) return <FaWater className={className} />;
    if (n.includes('cafe') || n.includes('coffee') || n.includes('tea')) return <FaCoffee className={className} />;
    if (n.includes('food') || n.includes('canteen') || n.includes('restaurant') || n.includes('meal')) return <FaUtensils className={className} />;
    if (n.includes('first aid') || n.includes('medical') || n.includes('health')) return <FaFirstAid className={className} />;
    if (n.includes('cctv') || n.includes('security') || n.includes('camera')) return <FaVideo className={className} />;
    if (n.includes('ac') || n.includes('air con') || n.includes('cooling')) return <FaSnowflake className={className} />;
    if (n.includes('coach') || n.includes('train')) return <FaUserTie className={className} />;
    if (n.includes('equip') || n.includes('kit') || n.includes('gear')) return <FaTshirt className={className} />;
    if (n.includes('turf') || n.includes('grass') || n.includes('ground')) return <FaLeaf className={className} />;
    if (n.includes('score') || n.includes('board')) return <FaListOl className={className} />;
    if (n.includes('seat') || n.includes('stand') || n.includes('gallery')) return <FaChair className={className} />;
    if (n.includes('child') || n.includes('kid')) return <FaBaby className={className} />;
    if (n.includes('atm') || n.includes('cash')) return <FaCreditCard className={className} />;

    return <FaQuestion className={className} />;
};
