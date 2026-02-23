import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // use a small timeout to ensure it runs after any layout shifts or framer-motion transforms
        const timeoutId = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            // Fallbacks for specific scroll containers if needed
            document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, 10);

        return () => clearTimeout(timeoutId);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
