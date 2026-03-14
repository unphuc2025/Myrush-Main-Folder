import {
    FaFutbol,
    FaBasketballBall,
    FaVolleyballBall,
    FaTableTennis,
    FaSwimmer,
    FaRunning
} from 'react-icons/fa';
import {
    GiCricketBat,
    GiShuttlecock,
    GiTennisRacket,
    GiHockey,
    GiBoxingGlove,
    GiTennisBall
} from 'react-icons/gi';
import { MdSportsKabaddi } from 'react-icons/md';

export const getSportIcon = (sport: string, className: string = "w-4 h-4") => {
    const s = sport.toLowerCase().trim();

    // Football / Soccer
    if (s.includes('football') || s.includes('soccer')) {
        return <FaFutbol className={className} />;
    }

    // Cricket
    if (s.includes('cricket')) {
        return <GiCricketBat className={className} />;
    }

    // Badminton
    if (s.includes('badminton')) {
        return <GiShuttlecock className={className} />;
    }

    // Tennis
    if (s.includes('tennis') && !s.includes('table')) {
        return <GiTennisRacket className={className} />;
    }

    // Basketball
    if (s.includes('basketball')) {
        return <FaBasketballBall className={className} />;
    }

    // Volleyball
    if (s.includes('volleyball')) {
        return <FaVolleyballBall className={className} />;
    }

    // Table Tennis
    if (s.includes('table tennis') || s.includes('ping pong')) {
        return <FaTableTennis className={className} />;
    }

    // Pickleball (Using tennis as a close match if specific icon is missing)
    if (s.includes('pickleball')) {
        return <GiTennisBall className={className} />;
    }

    // Hockey
    if (s.includes('hockey')) {
        return <GiHockey className={className} />;
    }

    // Swimming
    if (s.includes('swimming')) {
        return <FaSwimmer className={className} />;
    }

    // Boxing / MMA
    if (s.includes('boxing') || s.includes('mma') || s.includes('martial arts')) {
        return <GiBoxingGlove className={className} />;
    }

    // Kabaddi
    if (s.includes('kabaddi')) {
        return <MdSportsKabaddi className={className} />;
    }

    // Squash
    if (s.includes('squash')) {
        return <GiTennisRacket className={className} />;
    }

    // General / Fallback
    return <FaRunning className={className} />;
};
