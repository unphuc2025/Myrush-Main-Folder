import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { apiClient } from '../api/client'; // Import API client
import { Button } from '../components/ui/Button';
import { PhoneInput } from '../components/ui/PhoneInput';
import ScrollIndicator from '../components/ScrollIndicator';
import { useAuth } from '../context/AuthContext';
import { PublicNav } from '../components/PublicNav';
import { TopNav } from '../components/TopNav';
import { FaCalendarAlt, FaChartLine, FaCheckCircle, FaUserGraduate, FaClock } from 'react-icons/fa';
import { useNotification } from '../context/NotificationContext';

export const Academy: React.FC = () => {
    const { isAuthenticated } = useAuth();

    // Mock state to simulate user journey: 'marketing' | 'pending' | 'student'
    const [academyState, setAcademyState] = useState<'marketing' | 'pending' | 'student'>('marketing');

    if (!isAuthenticated) {
        return <AcademyLanding />;
    }


    // In a real app, this would come from an API based on the user's data
    if (academyState === 'marketing') {
        return <AcademyEnrollmentView onEnroll={() => setAcademyState('pending')} />;
    }

    if (academyState === 'pending') {
        return <AcademyPendingView onUpgrade={() => setAcademyState('student')} />;
    }

    return <AcademyDashboard />;
};

// --- LOGGED IN: ENROLLMENT VIEW (NEW USER) ---
const AcademyEnrollmentView: React.FC<{ onEnroll: () => void }> = ({ onEnroll }) => {
    // State for form fields
    const [sport, setSport] = useState('Football');
    const [experience, setExperience] = useState('Beginner');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth(); // Get user details if available
    const { showAlert } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!sport || !experience) {
            showAlert('Please select both sport and experience level', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            // Using the new academy registration endpoint
            const response = await apiClient.post('/academy/register', {
                athlete_name: user?.full_name || "Guest User",
                age_group: "Adult",
                contact_email: user?.email || "no-email@example.com",
                phone_number: user?.phone_number || "0000000000",
                preferred_sport: sport,
                experience_level: experience
            });

            if (response.data.success) {
                showAlert('Application Submitted Successfully!', 'success');
                onEnroll();
            } else {
                showAlert('Failed to submit application. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Academy submission error:', error);
            showAlert('An error occurred. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen font-sans relative overflow-hidden">
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-30 pointer-events-none"></div>

            <TopNav />
            <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-block px-4 py-1.5 rounded-full bg-black/5 backdrop-blur-md border border-black/10 text-primary text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                        Complete Your Profile
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold font-heading uppercase mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-black to-gray-700">
                        Join the <span className="text-primary">Academy</span>
                    </h1>
                    <p className="text-gray-600 text-lg mb-12 max-w-2xl mx-auto font-medium">
                        You're logged in but haven't enrolled yet. Submit your application to getting assigned a coach and batch.
                    </p>

                    <div className="glass-card p-10 rounded-xl shadow-xl max-w-xl mx-auto text-left">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2">Preferred Sport</label>
                                <select
                                    value={sport}
                                    onChange={(e) => setSport(e.target.value)}
                                    className="w-full h-14 bg-gray-50/50 rounded-xl px-4 font-bold border border-gray-100 focus:border-primary focus:ring-0 transition-all outline-none"
                                >
                                    <option>Football</option>
                                    <option>Badminton</option>
                                    <option>Cricket</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2">Experience Level</label>
                                <select
                                    value={experience}
                                    onChange={(e) => setExperience(e.target.value)}
                                    className="w-full h-14 bg-gray-50/50 rounded-xl px-4 font-bold border border-gray-100 focus:border-primary focus:ring-0 transition-all outline-none"
                                >
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                            <Button
                                className="w-full h-14 font-black uppercase tracking-widest shadow-glow transition-transform flex items-center justify-center border-2 border-transparent"
                                variant="primary"
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'Submit Application'
                                )}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// --- LOGGED IN: PENDING VIEW ---
const AcademyPendingView: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
    return (
        <div className="min-h-screen font-sans relative overflow-hidden">
            {/* Global Atmosphere */}
            <div className="fixed inset-0 z-0 mesh-bg opacity-30 pointer-events-none"></div>

            <TopNav />
            <div className="pt-32 pb-20 px-4 max-w-3xl mx-auto text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-12 rounded-xl shadow-xl flex flex-col items-center"
                >
                    <div className="w-24 h-24 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center text-4xl mb-8 shadow-inner">
                        <FaClock />
                    </div>
                    <h2 className="text-3xl font-extrabold font-heading uppercase mb-4 text-gray-900">Application Pending</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
                        Our coaches are reviewing your profile. You will be assigned a batch shortly.
                    </p>

                    {/* DEMO ONLY BUTTON */}
                    <button
                        onClick={onUpgrade}
                        className="text-xs font-bold text-gray-400 hover:text-primary underline uppercase tracking-widest transition-colors cursor-pointer"
                    >
                        [Demo: Coach Approved Me]
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

// --- LOGGED IN VIEW: STUDENT DASHBOARD (Existing) ---
const AcademyDashboard: React.FC = () => {
    return (
        <div className="min-h-screen font-sans relative">
            <div className="fixed inset-0 z-0 mesh-bg opacity-20 pointer-events-none"></div>
            <TopNav />

            {/* Academy Hero */}
            <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1624880357913-a8539238245b?q=80&w=2070"
                        alt="Academy Hero"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 text-center w-full px-6 mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white uppercase tracking-widest"
                    >
                        Student Portal
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl md:text-4xl lg:text-5xl font-extrabold font-heading uppercase leading-tight text-white mb-8"
                    >
                        My <span className="text-primary">Academy</span>
                    </motion.h1>
                </div>
            </section>

            <div className="-mt-20 relative z-20 px-4 md:px-8 max-w-screen-2xl mx-auto pb-20">

                {/* Info Cards */}
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-8 rounded-xl shadow-sm flex items-start gap-4 hover:shadow-glow transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-sm">
                            <FaUserGraduate />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Batch</p>
                            <h3 className="text-xl font-bold mt-1 text-gray-900">Rajajinagar U-18</h3>
                            <p className="text-sm text-gray-500 mt-1">Coach: Nikhit Fernandes</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-8 rounded-xl shadow-sm flex items-start gap-4 hover:shadow-glow transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl shadow-sm">
                            <FaCheckCircle />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attendance</p>
                            <h3 className="text-xl font-bold mt-1 text-gray-900">85%</h3>
                            <p className="text-sm text-gray-500 mt-1">22/26 Sessions Attended</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-8 rounded-xl shadow-sm flex items-start gap-4 hover:shadow-glow transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shadow-sm">
                            <FaChartLine />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Performance</p>
                            <h3 className="text-xl font-bold mt-1 text-gray-900">Excellent</h3>
                            <p className="text-sm text-gray-500 mt-1">Top 10% in Speed Tests</p>
                        </div>
                    </motion.div>
                </div>

                {/* Upcoming Classes */}
                <h2 className="text-2xl font-black font-heading uppercase mb-6 drop-shadow-sm">Upcoming Sessions</h2>
                <div className="glass-card rounded-xl overflow-hidden shadow-sm">
                    {[
                        { date: 'Today', time: '5:00 PM - 7:00 PM', topic: 'Technical Drills: Passing', status: 'Upcoming' },
                        { date: 'Friday, Oct 27', time: '5:00 PM - 7:00 PM', topic: 'Practice Match', status: 'Scheduled' },
                        { date: 'Monday, Oct 30', time: '5:00 PM - 7:00 PM', topic: 'Fitness & Agility', status: 'Scheduled' },
                    ].map((session, i) => (
                        <div key={i} className="p-6 border-b border-gray-100 last:border-0 flex items-center justify-between transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{session.date}</h4>
                                    <p className="text-sm text-gray-500">{session.time} • {session.topic}</p>
                                </div>
                            </div>
                            <span className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${session.status === 'Upcoming' ? 'bg-primary/20 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                {session.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- GUEST VIEW: LANDING PAGE ---
const AcademyLanding: React.FC = () => {
    const { scrollY } = useScroll();
    const { showAlert } = useNotification();
    const indicatorOpacity = useTransform(scrollY, [0, 300], [1, 0]);

    // Trial Form State
    const [trialData, setTrialData] = React.useState({
        kidFirstName: '',
        kidLastName: '',
        parentEmail: '',
        countryCode: '+91',
        parentMobile: '',
        location: '',
        preferredDate: ''
    });
    const [trialErrors, setTrialErrors] = React.useState<Record<string, string>>({});
    const [isSubmittingTrial, setIsSubmittingTrial] = React.useState(false);

    const validateTrialForm = () => {
        const errors: Record<string, string> = {};
        if (!trialData.kidFirstName.trim()) errors.kidFirstName = 'Kid\'s first name is required';
        if (!trialData.kidLastName.trim()) errors.kidLastName = 'Kid\'s last name is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trialData.parentEmail.trim()) {
            errors.parentEmail = 'Email is required';
        } else if (!emailRegex.test(trialData.parentEmail)) {
            errors.parentEmail = 'Invalid email address';
        }

        const isIndia = trialData.countryCode === '+91';
        if (!trialData.parentMobile.trim()) {
            errors.parentMobile = 'Phone number is required';
        } else if (isIndia && !/^[6-9]\d{9}$/.test(trialData.parentMobile)) {
            errors.parentMobile = 'Invalid Indian phone number (10 digits)';
        } else if (trialData.parentMobile.length < 7) {
            errors.parentMobile = 'Invalid phone number (too short)';
        }

        if (!trialData.location) errors.location = 'Please select a location';
        if (!trialData.preferredDate) errors.preferredDate = 'Please select a date';

        setTrialErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleTrialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateTrialForm()) return;
        setIsSubmittingTrial(true);

        try {
            const response = await apiClient.post('/contact/submit', {
                form_type: 'academy_trial',
                name: `Athlete: ${trialData.kidFirstName} ${trialData.kidLastName}`,
                email: trialData.parentEmail,
                phone: `${trialData.countryCode}${trialData.parentMobile}`,
                sport: 'Any',
                location: trialData.location,
                preferred_date: trialData.preferredDate,
                message: "Trial Registration Application"
            });
            if (response.data.success) {
                showAlert(response.data.message, 'success');
                setTrialData({
                    kidFirstName: '',
                    kidLastName: '',
                    parentEmail: '',
                    countryCode: '+91',
                    parentMobile: '',
                    location: '',
                    preferredDate: ''
                });
                setTrialErrors({});
            } else {
                showAlert('Registration failed. Please try again.', 'error');
            }
        } catch (err) {
            showAlert('Error submitting registration. Please try again.', 'error');
        } finally {
            setIsSubmittingTrial(false);
        }
    };

    const locations = [
        {
            name: 'Rajajinagar',
            address: 'Rush Arena, Rajajinagar',
            days: 'Tue, Thu & Sat',
            timings: '5PM to 7PM',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rush+Arena+Rajajinagar+Bangalore'
        },
        {
            name: 'Kasavanahalli (Owners Court)',
            address: 'Rush Arena, Kasavanahalli',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 7PM',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rush+Arena+Kasavanahalli+Bangalore'
        },
        {
            name: 'Vijaynagar @ GT World Mall',
            address: 'Rush Arena GT Mall',
            days: 'Sat & Sunday',
            timings: '8.30AM to 9.30AM',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rush+Arena+GT+World+Mall+Bangalore'
        },
        {
            name: 'Hesarghatta Main Road',
            address: 'Rush Arena Hesargatta Main Road',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 7PM',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rush+Arena+Hesargatta+Main+Road+Bangalore'
        },
        {
            name: 'Cooke Town',
            address: 'Rush Arena, Cooke Town',
            days: 'Mon, Wed, Fri',
            timings: '5PM to 6PM',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rush+Arena+Cooke+Town+Bangalore'
        },
        {
            name: 'Vidyaranyapura',
            address: 'ToughX Arena',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 7PM',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=ToughX+Arena+Vidyaranyapura+Bangalore'
        },
        {
            name: 'Old Airport Road',
            address: 'Rush Arena, Old Airport Road',
            days: 'Mon, Wed & Fri',
            timings: '5PM to 6PM',
            mapUrl: 'https://www.google.com/maps/search/?api=1&query=Rush+Arena+Old+Airport+Road+Bangalore'
        }
    ];

    const team = [
        { name: 'Nikhit Fernandes', role: 'Director of Football', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/749a3bdc-8950-46a4-b517-b9749f837d46/Coach+Pics.png' },
        { name: 'Harish', role: 'Operations Manager & Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/a0d027b7-c26e-4b2b-8b82-1ca19c15d34a/9.png' },
        { name: 'Dominic', role: 'Coach D Licence', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/4333df17-6d51-4d4d-90c4-0dc24bef7da4/1.png' },
        { name: 'Mark', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/5e29913b-2a1b-484e-b219-6cc543fd9307/6.png' },
        { name: 'Jeremy', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/aa5a2d2b-d1cf-4813-9465-c2601cc67196/2.png' },
        { name: 'Nikita', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/ecfc50cd-3d7f-4759-8a8d-cc5b07c8955b/3.png' },
        { name: 'Manjhi', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/14c088b4-2802-455d-87dd-60f0947cff27/5.png' },
        { name: 'Mugilan', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/a3cc189e-bcb0-4f52-81ca-7807bf2c821d/7.png' },
        { name: 'Abhishek', role: 'Coach', image: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/924a1da3-37dd-49ec-848f-a78fc999fb6e/8.jpg' }
    ];

    return (
        <div className="min-h-screen bg-white font-sans relative selection:bg-primary selection:text-black">
            <div className="fixed inset-0 z-0 mesh-bg opacity-10 pointer-events-none"></div>
            {/* Sticky Navigation */}
            {/* Sticky Navigation */}
            <PublicNav />

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black px-4">
                {/* Background Image with Deep Gradient Overlay */}
                {/* Background Image with Deep Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover object-center opacity-70"
                    >
                        <source src="/academy-assets/academy-hero.mp4" type="video/mp4" />
                    </video>
                </div>

                <motion.div
                    className="relative z-20 text-center w-full max-w-7xl py-32 flex flex-col items-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="inline-flex items-center gap-3 mb-6 md:mb-8 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-xl mx-auto whitespace-nowrap overflow-hidden"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] md:text-sm font-bold font-heading text-primary uppercase tracking-[0.2em] whitespace-nowrap">
                            Speak to us now - +91-8548946999
                        </span>
                    </motion.div>

                    {/* Main Heading */}
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black font-heading text-white mb-8 md:mb-12 leading-[1.1] tracking-tight uppercase text-center px-2">
                        Unlock Your <br className="hidden md:block" />
                        <span className="text-primary">Football Potential</span> <br />
                        with Rush Academy.
                    </h1>

                    {/* CTA Section */}
                    <div className="flex flex-row items-center justify-center gap-3 md:gap-6 px-4 md:px-0">
                        <Button
                            variant="primary"
                            size="lg"
                            className="flex-1 sm:flex-none !border-2 !border-transparent text-[10px] sm:text-sm md:text-base px-4 sm:px-8 py-3 md:py-4 min-w-[140px] sm:min-w-[200px] uppercase tracking-wider font-heading font-bold transition-all duration-300 shadow-glow whitespace-nowrap group flex items-center justify-center"
                            onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Book A Free Trial Class
                        </Button>
                    </div>
                </motion.div>

                <motion.div style={{ opacity: indicatorOpacity }}>
                    <ScrollIndicator />
                </motion.div>
            </section>



            {/* Why Rush Academy Section */}
            <section id="why-rush" className="py-12 md:py-16 bg-white w-full">
                <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="mb-12">
                        <h2 className="text-3xl md:text-5xl font-black font-heading text-black uppercase leading-tight mb-8 md:mb-12">
                            Why <span className="text-primary">Rush Academy?</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 w-full">
                        {[
                            {
                                title: 'Expert Coaching',
                                description: 'At Rush Academy, we pride ourselves on providing top-notch coaching led by experienced and qualified trainers. Our coaches are passionate about nurturing talent, offering personalized guidance, and fostering a positive learning environment, ensuring every player receives the attention they need to develop their soccer skills.',
                                image: '/images/academy/expert-coaching.png'
                            },
                            {
                                title: 'Comprehensive Development',
                                description: 'Joining Rush Academy offers more than just soccer training. We focus on a holistic approach to player development, encompassing physical fitness, tactical understanding, mental resilience, and teamwork. Our goal is to mold well-rounded athletes, both on and off the field, setting them up for success in sports and life.',
                                image: '/images/academy/comprehensive-development.png'
                            },
                            {
                                title: 'State-of-the-Art Facilities',
                                description: 'As a leading soccer academy, we boast state-of-the-art training facilities designed to optimize player performance. From well-maintained pitches to modern amenities, our infrastructure ensures an ideal environment for players to train, grow, and excel in their soccer journey.',
                                image: '/images/academy/facilities.png'
                            },
                            {
                                title: 'Competitive Opportunities',
                                description: 'Rush Academy provides its players with access to competitive leagues and tournaments, both locally and nationally. Participating in such events allows players to showcase their skills, gain valuable match experience, and potentially attract opportunities for higher-level competitions.',
                                image: '/images/academy/competitive-opportunities.png'
                            },
                            {
                                title: 'Inclusive and Supportive Environment',
                                description: 'We embrace diversity and welcome players of all ages, genders, and skill levels. Our academy fosters a supportive and inclusive community where players build lasting friendships, learn valuable life skills, and develop a passion for the beautiful game in a fun and nurturing atmosphere.',
                                image: '/images/academy/inclusive-environment.png'
                            },
                            {
                                title: 'Pathway to Success',
                                description: 'Rush Academy has a proven track record of producing talented players who have gone on to represent professional clubs, college teams, and even national squads. For aspiring young athletes, our academy serves as a stepping stone towards fulfilling their dreams of playing soccer at higher levels and pursuing a career in the sport they love.',
                                image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1949&auto=format&fit=crop'
                            }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                className="flex flex-col group"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="mb-6 overflow-hidden rounded-lg aspect-[4/3]">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover transform transition-transform duration-500"
                                    />
                                </div>
                                <h4 className="text-black">
                                    {item.title}
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Locations */}
            <section id="our-locations" className="py-12 md:py-16 bg-black relative overflow-hidden w-full">
                <div className="absolute inset-0 bg-dark-gradient opacity-100 z-0" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,210,106,0.15),transparent)] pointer-events-none z-0" />

                <div className="w-full max-w-screen-2xl mx-auto relative z-10 px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl md:text-5xl font-black font-heading text-white uppercase leading-tight mb-8 md:mb-12">
                                Our <span className="text-primary">Centers</span>
                            </h2>
                            <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                                World-class facilities across Bengaluru.
                            </p>
                        </div>
                        <div className="h-[1px] flex-grow bg-white/10 mb-8 hidden lg:block mx-12"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {locations.map((location, index) => (
                            <motion.div
                                key={index}
                                className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 transition-all duration-300 group cursor-pointer flex flex-col h-full relative overflow-hidden"
                                onClick={() => window.open(location.mapUrl, '_blank')}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors" />

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full transition-all duration-300 shadow-lg ml-auto">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-black font-bold text-lg">
                                            ↗
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-primary mb-2 uppercase tracking-wide group-hover:text-primary transition-colors relative z-10">
                                    {location.name}
                                </h3>
                                <p className="text-sm text-white/80 mb-8 font-medium line-clamp-2">
                                    {location.address}
                                </p>

                                <div className="mt-auto w-full bg-black/40 rounded-xl p-5 border border-white/5 group-hover:border-primary/30 transition-colors">
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Days</span>
                                            <span className="text-sm font-bold text-white">{location.days}</span>
                                        </div>
                                        <div className="w-full h-[1px] bg-white/10" />
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">Timings</span>
                                            <span className="text-sm font-bold text-white">{location.timings}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* The Coaches */}
            <section id="meet-the-team" className="py-12 md:py-16 bg-gray-50 w-full">
                <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl md:text-5xl font-black font-heading text-black uppercase leading-tight mb-8 md:mb-12">
                                Meet the <span className="text-primary">Academy Team</span>
                            </h2>
                        </div>
                        <div className="h-[1px] flex-grow bg-gray-200 mb-8 hidden lg:block mx-12"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 lg:gap-x-12 lg:gap-y-16">
                        {team.map((member, index) => (
                            <motion.div
                                key={index}
                                className="group flex flex-col items-center"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className="relative mb-10 w-full aspect-square max-w-[280px] overflow-hidden rounded-xl bg-gray-200 shadow-premium transition-all duration-500">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover transition-all duration-1000"
                                    />
                                </div>
                                <h3 className="text-h6 text-black mb-3 uppercase tracking-tighter group-hover:text-primary transition-colors text-center w-full">
                                    {member.name}
                                </h3>
                                <p className="text-sm font-bold tracking-[0.1em] uppercase text-gray-400 group-hover:text-primary transition-colors text-center w-full">
                                    {member.role}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-12 md:py-16 bg-white w-full">
                <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                        <div className="max-w-3xl">
                            <h2 className="text-3xl md:text-5xl font-black font-heading text-black uppercase leading-tight mb-8 md:mb-12">
                                Choose your <span className="text-primary">plan:</span>
                            </h2>
                        </div>
                        <div className="h-[1px] flex-grow bg-gray-100 mb-8 hidden lg:block mx-12"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-20">
                        {/* Quarterly Plan */}
                        <motion.div
                            className="relative flex flex-col bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover rounded-xl shadow-lg border border-gray-100"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="h-12 bg-primary/20 w-full rounded-t-xl" />
                            <div className="p-10 flex flex-col items-center text-center flex-grow pt-16">
                                <h3 className="text-xl font-bold underline mb-8">Quarterly</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-black block mb-2">Starting from INR</span>
                                    <span className="text-5xl font-black">8,999</span>
                                </div>
                                <p className="text-sm italic text-gray-500 mb-12">*Depends on location</p>
                                <div className="mt-auto w-full">
                                    <Button
                                        variant="primary"
                                        className="w-full h-14 bg-black text-white hover:bg-gray-800 font-extrabold uppercase tracking-widest text-sm rounded-lg"
                                        onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Free Trial
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Semi-annually Plan */}
                        <motion.div
                            className="relative flex flex-col bg-white transition-all duration-300 md:scale-105 z-10 rounded-xl border-2 border-primary shadow-glow shadow-primary/20"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="absolute top-0 right-0 left-0 flex justify-center z-20 -translate-y-1/2">
                                <div className="bg-primary text-black font-bold px-6 py-2 rounded-full shadow-lg uppercase tracking-widest text-[10px] border-2 border-white">
                                    Most Popular
                                </div>
                            </div>
                            <div className="h-12 bg-primary/40 w-full rounded-t-xl" />
                            <div className="p-10 flex flex-col items-center text-center flex-grow pt-16">
                                <h3 className="text-xl font-bold underline mb-8">Semi-annually</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-black block mb-2">Starting from INR</span>
                                    <span className="text-5xl font-black">14,999</span>
                                </div>
                                <p className="text-sm italic text-gray-500 mb-12">*Depends on location</p>
                                <div className="mt-auto w-full">
                                    <Button
                                        variant="primary"
                                        className="w-full h-14 bg-black text-white hover:bg-gray-800 font-extrabold uppercase tracking-widest text-sm rounded-lg"
                                        onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Free Trial
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Annual Program */}
                        <motion.div
                            className="relative flex flex-col bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover rounded-xl shadow-lg border border-gray-100"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="h-12 bg-primary/20 w-full rounded-t-xl" />
                            <div className="p-10 flex flex-col items-center text-center flex-grow pt-16">
                                <h3 className="text-xl font-bold underline mb-8">Annual Program</h3>
                                <div className="mb-4">
                                    <span className="text-3xl font-black block mb-2">Starting from INR</span>
                                    <span className="text-5xl font-black">25,999</span>
                                </div>
                                <p className="text-sm italic text-gray-500 mb-12">*Depends on location</p>
                                <div className="mt-auto w-full">
                                    <Button
                                        variant="primary"
                                        className="w-full h-14 bg-black text-white hover:bg-gray-800 font-extrabold uppercase tracking-widest text-sm rounded-lg"
                                        onClick={() => document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        Free Trial
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Enrollment Section */}
            <section id="enroll-section" className="relative bg-black overflow-hidden py-24 md:py-32 border-t border-white/10">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 -left-1/4 w-[150%] h-[150%] bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-full blur-[120px]" />
                </div>

                <div className="w-full max-w-screen-2xl mx-auto relative z-10 px-4 md:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 text-white">
                        <div className="w-full lg:w-5/12 relative z-20">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase">
                                    Join The Elite
                                </div>
                                <h2 className="!text-5xl md:text-7xl lg:text-8xl font-extrabold font-heading leading-tight mb-10 tracking-tight uppercase">
                                    Book a Free <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Trial Class</span>
                                </h2>
                                <p className="text-white/60 mb-10 leading-relaxed max-w-lg">
                                    Give your child a taste of excellence with Rush Academy's free trial. Fill out the form below to secure a spot in our dynamic training sessions led by experienced coaches.
                                </p>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="w-full lg:w-6/12 relative z-20"
                        >
                            <form className="space-y-6" onSubmit={handleTrialSubmit}>
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Kid's First Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Leo"
                                                value={trialData.kidFirstName}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || /^[A-Za-z\s]*$/.test(value)) {
                                                        setTrialData({ ...trialData, kidFirstName: value });
                                                        if (trialErrors.kidFirstName) setTrialErrors({ ...trialErrors, kidFirstName: '' });
                                                    }
                                                }}
                                                className={`w-full bg-white/5 border ${trialErrors.kidFirstName ? 'border-red-500' : 'border-white/10'} rounded-xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm shadow-inner`}
                                            />
                                            {trialErrors.kidFirstName && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{trialErrors.kidFirstName}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Kid's Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Messi"
                                                value={trialData.kidLastName}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    if (value === '' || /^[A-Za-z\s]*$/.test(value)) {
                                                        setTrialData({ ...trialData, kidLastName: value });
                                                        if (trialErrors.kidLastName) setTrialErrors({ ...trialErrors, kidLastName: '' });
                                                    }
                                                }}
                                                className={`w-full bg-white/5 border ${trialErrors.kidLastName ? 'border-red-500' : 'border-white/10'} rounded-xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm shadow-inner`}
                                            />
                                            {trialErrors.kidLastName && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{trialErrors.kidLastName}</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Parent's Email</label>
                                        <input
                                            type="email"
                                            placeholder="parent@email.com"
                                            value={trialData.parentEmail}
                                            onChange={(e) => {
                                                setTrialData({ ...trialData, parentEmail: e.target.value });
                                                if (trialErrors.parentEmail) setTrialErrors({ ...trialErrors, parentEmail: '' });
                                            }}
                                            className={`w-full bg-white/5 border ${trialErrors.parentEmail ? 'border-red-500' : 'border-white/10'} rounded-xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm shadow-inner`}
                                        />
                                        {trialErrors.parentEmail && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{trialErrors.parentEmail}</span>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <PhoneInput
                                            label="Parent/Guardian Mobile Number"
                                            countryCode={trialData.countryCode}
                                            phoneNumber={trialData.parentMobile}
                                            onCodeChange={(code) => setTrialData({ ...trialData, countryCode: code })}
                                            onNumberChange={(num) => setTrialData({ ...trialData, parentMobile: num })}
                                            error={trialErrors.parentMobile}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Preferred Center</label>
                                            <select
                                                value={trialData.location}
                                                onChange={(e) => {
                                                    setTrialData({ ...trialData, location: e.target.value });
                                                    if (trialErrors.location) setTrialErrors({ ...trialErrors, location: '' });
                                                }}
                                                className={`w-full bg-white/5 border ${trialErrors.location ? 'border-red-500' : 'border-white/10'} rounded-xl px-6 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm cursor-pointer appearance-none [&>option]:bg-black [&>option]:text-white`}
                                            >
                                                <option value="" disabled>Select Center</option>
                                                {locations.map((loc, i) => (
                                                    <option key={i} value={loc.name}>{loc.name}</option>
                                                ))}
                                            </select>
                                            {trialErrors.location && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{trialErrors.location}</span>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Preferred Date</label>
                                            <input
                                                type="date"
                                                value={trialData.preferredDate}
                                                onChange={(e) => {
                                                    setTrialData({ ...trialData, preferredDate: e.target.value });
                                                    if (trialErrors.preferredDate) setTrialErrors({ ...trialErrors, preferredDate: '' });
                                                }}
                                                className={`w-full bg-white/5 border ${trialErrors.preferredDate ? 'border-red-500' : 'border-white/10'} rounded-xl px-6 py-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm cursor-pointer [color-scheme:dark]`}
                                            />
                                            {trialErrors.preferredDate && <span className="text-[10px] text-red-500 uppercase font-bold tracking-wider ml-1">{trialErrors.preferredDate}</span>}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            disabled={isSubmittingTrial}
                                            className="w-full md:w-auto px-12 py-5 bg-primary text-black rounded-xl uppercase tracking-[0.2em] font-black shadow-glow transition-all active:scale-[0.98] text-lg flex items-center justify-center min-w-[200px]"
                                        >
                                            {isSubmittingTrial ? (
                                                <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                'Send Application →'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div >
    );
};