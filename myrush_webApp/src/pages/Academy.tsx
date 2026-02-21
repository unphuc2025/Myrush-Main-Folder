import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { PublicNav } from '../components/PublicNav';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';

export const Academy: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        return <AcademyDisabledView navigate={navigate} isAuthenticated={isAuthenticated} />;
    }

    return <AcademyDisabledView navigate={navigate} isAuthenticated={isAuthenticated} />;
};

// --- DISABLED VIEW ---
const AcademyDisabledView: React.FC<{ navigate: any; isAuthenticated: boolean }> = ({ navigate, isAuthenticated }) => {
    return (
        <div className="min-h-screen font-inter relative overflow-hidden">
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-30 pointer-events-none"></div>

            {isAuthenticated ? <TopNav /> : <PublicNav />}

            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-12 rounded-[3rem] shadow-xl"
                >
                    <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-4xl mb-8 mx-auto">
                        <span className="text-4xl">🎓</span>
                    </div>
                    <h2 className="text-3xl font-black font-montserrat uppercase mb-4 text-gray-900">Academy Coming Soon</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
                        The Rush Academy feature is currently being updated. Check back soon for exciting new programs!
                    </p>

                    <Button
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-bold text-lg"
                        onClick={() => navigate('/')}
                    >
                        Return to Home
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};