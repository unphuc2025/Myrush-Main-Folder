import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { FaArrowRight, FaCalendarCheck } from 'react-icons/fa';
import { PublicNav } from '../components/PublicNav';
import { ContactSection } from '../components/ContactSection';
import ScrollIndicator from '../components/ScrollIndicator';

const DynamicHeroBackground: React.FC<{ scrollY: any }> = ({ scrollY }) => {
    const [isMobile, setIsMobile] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 50, stiffness: 300 };
    const smoothMouseX = useSpring(mouseX, springConfig);
    const smoothMouseY = useSpring(mouseY, springConfig);

    const translateX = useTransform(smoothMouseX, [-500, 500], [-20, 20]);
    const translateY = useTransform(smoothMouseY, [-250, 250], [-10, 10]);
    const heroScrollY = useTransform(scrollY, [0, 500], [0, 150]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const moveX = clientX - window.innerWidth / 2;
            const moveY = clientY - window.innerHeight / 2;
            mouseX.set(moveX);
            mouseY.set(moveY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', checkMobile);
        };
    }, [mouseX, mouseY]);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/40 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />

            <motion.div
                style={{ y: isMobile ? 0 : heroScrollY }}
                className="absolute inset-0 z-0"
            >
                <motion.div
                    style={{ x: translateX, y: translateY, scale: 1.1 }}
                    className="absolute inset-0"
                >
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src="/hero-bg.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </motion.div>
            </motion.div>
        </div>
    );
};

const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
};

const marqueeVariants: Variants = {
    animate: {
        x: [0, "-50%"],
        transition: {
            x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30, // Increased duration for a smoother, slower scroll
                ease: "linear",
            },
        },
    },
};

export const LandingPage: React.FC = () => {
    useEffect(() => {
        console.log("DEBUG: LandingPage Version 2.0 - Marquee Fixed");
    }, []);
    const navigate = useNavigate();
    const { scrollY } = useScroll();
    // const headersOpacity = useTransform(scrollY, [0, 100], [0, 1]);
    const indicatorOpacity = useTransform(scrollY, [0, 300], [1, 0]);

    const services = [
        {
            title: 'Rush Arena',
            description: 'World-class facilities across 9 centers. Premium turfs, lighting, and amenities.',
            icon: '🏟️',
            image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070',
            link: '/arena',
            colSpan: 'md:col-span-2'
        },
        {
            title: 'Academy',
            description: "Bengaluru's fastest-growing football academy. Train with the best.",
            icon: '🎓',
            image: 'https://images.unsplash.com/photo-1624880357913-a8539238245b?q=80&w=2070',
            link: '/academy',
            colSpan: 'md:col-span-1'
        },
        {
            title: 'Corporate',
            description: 'Team building and sports events for businesses.',
            icon: '🤝',
            image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070',
            link: '/corporate',
            colSpan: 'md:col-span-2'
        },
        {
            title: 'Tournaments',
            description: 'Compete in high-stakes leagues and tournaments.',
            icon: '🏆',
            image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2086',
            link: '#',
            colSpan: 'md:col-span-1',
            comingSoon: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden selection:bg-primary selection:text-black">
            {/* Sticky Navigation */}
            {/* Sticky Navigation */}
            <PublicNav />

            {/* HERO SECTION */}
            <section className="relative h-screen min-h-screen flex items-center justify-center overflow-hidden bg-black">
                <DynamicHeroBackground scrollY={scrollY} />

                <div className="relative z-20 text-center px-4 max-w-5xl mx-auto mt-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-[7.5px] border border-primary/30 bg-primary/10 backdrop-blur-md text-[9px] sm:text-xs font-bold text-primary tracking-[0.2em] uppercase"
                    >
                        The Ultimate Sports Platform
                    </motion.div>

                    <motion.h1
                        className="!text-6xl md:!text-5xl lg:!text-7xl font-extrabold font-heading tracking-normal text-white mb-8 md:mb-12 uppercase leading-[1.05]"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        Play <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Like</span><br />
                        A Pro
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-row items-center justify-center gap-3 md:gap-6 px-2"
                    >
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/venues')}
                            icon={<FaCalendarCheck className="hidden sm:inline" />}
                            className="flex-1 sm:flex-none text-[10px] sm:text-sm md:text-base px-2 sm:px-8 py-3 md:py-4 min-w-0 sm:min-w-[200px] uppercase tracking-wider font-heading font-bold transition-all duration-300 shadow-glow hover:shadow-glow-strong whitespace-nowrap"
                        >
                            Book a Court
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate('/arena')}
                            icon={<FaArrowRight className="hidden sm:inline group-hover:translate-x-1 transition-transform" />}
                            className="flex-1 sm:flex-none border border-primary bg-black/40 backdrop-blur-md text-white hover:brightness-110 text-[10px] sm:text-sm md:text-base px-2 sm:px-8 py-3 md:py-4 min-w-0 sm:min-w-[200px] uppercase tracking-wider font-heading font-bold transition-all duration-300 group shadow-glow hover:shadow-glow-strong whitespace-nowrap"
                        >
                            Explore Venues
                        </Button>
                    </motion.div>
                </div>

                <motion.div style={{ opacity: indicatorOpacity }}>
                    <ScrollIndicator />
                </motion.div>
            </section>

            {/* MARQUEE STRIP */}
            <div className="bg-primary overflow-hidden py-4 z-30 relative shadow-glow -rotate-1 scale-105 border-y-4 border-black mt-8">
                <motion.div
                    className="flex whitespace-nowrap"
                    variants={marqueeVariants}
                    animate="animate"
                >
                    {/* Duplicate set for seamless loop */}
                    {[...Array(20)].map((_, i) => (
                        <span key={i} className="text-black font-bold text-3xl mx-8 uppercase font-heading italic tracking-tighter flex items-center gap-4">
                            RUSH ARENA • ACADEMY • TOURNAMENTS • CORPORATE •
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* SERVICES GRID */}
            <section className="py-12 md:py-16 bg-white">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="text-2xl md:text-4xl font-extrabold font-heading text-white uppercase leading-tight">
                            Our <span className="text-primary italic">Services</span>
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Welcome to Rush Arena, a premier chain of sports arenas with 9 centers, offering world-class facilities. Located in Bengaluru, Hyderabad and Chennai.
                        </p>
                    </div>

                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {services.map((service, i) => (
                            <motion.div
                                key={i}
                                className="group relative overflow-hidden rounded-xl bg-black h-96 shadow-2xl cursor-pointer"
                                custom={i}
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                onClick={() => {
                                    // @ts-ignore
                                    if (!service.comingSoon) {
                                        navigate(service.link);
                                    }
                                }}
                            >
                                <div className="absolute inset-0">
                                    <img
                                        src={service.image}
                                        alt={service.title}
                                        className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    <div className="flex justify-end items-start mb-auto">
                                        {/* @ts-ignore */}
                                        {service.comingSoon && (
                                            <span className="px-3 py-1 rounded-full bg-primary text-black text-xs font-bold uppercase tracking-wider shadow-lg">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col h-[160px] md:h-[140px] justify-start transition-all duration-300">
                                        <div className="flex items-center gap-[6px] mb-4">
                                            <h3 className="text-xl md:text-2xl font-extrabold text-white font-heading uppercase italic leading-none m-0 p-0">
                                                {service.title}
                                            </h3>
                                            {!service.comingSoon && (
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xs shadow-lg transition-transform duration-300 group-hover:scale-110">
                                                    <span>↗</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed">
                                            {service.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => navigate('/venues')}
                            className="bg-primary text-black hover:bg-primary-hover text-lg px-8 py-4 uppercase tracking-wider font-heading font-extrabold rounded-[7.5px] shadow-glow hover:shadow-glow-strong"
                        >
                            View All Facilities
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* CLIENTS SECTION */}
            <section className="py-12 md:py-16 bg-gray-50 overflow-hidden relative">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center"
                    >
                        <h3 className="text-2xl md:text-4xl font-black text-black font-heading uppercase tracking-tight mb-4">
                            Trusted by <span className="text-primary">Industry Leaders</span>
                        </h3>
                        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
                            Partnering with the world's most innovative companies to elevate sports culture.
                        </p>
                    </motion.div>
                </div>

                {/* Gradient Masks for Premium Feel */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

                <div className="relative z-10 overflow-hidden py-10">
                    <motion.div
                        className="flex whitespace-nowrap gap-16 md:gap-24 items-center w-max"
                        variants={marqueeVariants}
                        animate="animate"
                    >
                        {/* Duplicate the array 3 times to ensure no gaps during loop */}
                        {[...Array(3)].map((_, groupIndex) => (
                            <React.Fragment key={groupIndex}>
                                {[
                                    { name: 'WeWork', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/2d0b91a9-133a-49ba-b4d9-66daa96deb3b/we_avatar_qr.bca8f0cdca8104e6ac293e4b95862f8c.png?format=300w' },
                                    { name: 'Amazon', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/a3016f65-d5c7-4462-80d7-377435224838/Amazon-logo-meaning.jpg?format=500w' },
                                    { name: 'AIFF', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/5a575ade-272e-4e66-a038-641d381953fd/All_India_Football_Federation_logo.png' },
                                    { name: 'Kotak', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/d338c19b-08f1-490c-8d2a-583817365eed/1200px-Kotak_Mutual_Fund_logo.svg+%282%29.png' },
                                    { name: 'Hosachiguru', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/93e041cc-f9c3-4965-a3b6-0203a31f936d/Hosachiguru.png' },
                                    { name: 'Bengaluru FC', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/d742993b-fd42-424b-986d-291fb798d44a/Bengaluru_FC_logo.svg+%281%29.png' },
                                    { name: 'SILA', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/d2c6d315-f797-4251-a279-4b3c59d3740d/SILA+Logo+Grey.png' },
                                    { name: 'Applied', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/afe2353e-b057-435f-b0f4-026b5145efe7/Appliedlogo_blue_102021%5B1953674%5D.png' },
                                    { name: 'Torpedoes', logo: 'https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/628119dc-b0cd-43f0-b35b-bbad924c35c3/Bengaluru_Torpedoes_pvl_team_logo-2.png' },
                                ].map((client) => (
                                    <div
                                        key={`${groupIndex}-${client.name}`}
                                        className="inline-flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 hover:scale-110"
                                    >
                                        <img
                                            src={client.logo}
                                            alt={client.name}
                                            className="h-10 md:h-12 lg:h-16 w-auto object-contain mix-blend-multiply"
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CONTACT SECTION (Directly follows Clients) */}
            <ContactSection />

            {/* FOOTER */}
        </div>
    );
};
