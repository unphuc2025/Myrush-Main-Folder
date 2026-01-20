import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    const services = [
        {
            title: 'Rush Arena',
            description: 'Welcome to Rush Arena, a premier chain of sports arenas with 9 centers, offering world-class facilities. Located in Bengaluru, Hyderabad and Chennai.',
            cta: 'Our Locations',
            image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070',
            link: '/dashboard'
        },
        {
            title: 'Rush Academy',
            description: "Discover Rush Academy, Bengaluru's fastest-growing football academy, empowering aspiring players across the city. Our teams excel in senior and junior divisions of the association league.",
            cta: 'Book A Free Trial',
            image: 'https://images.unsplash.com/photo-1624880357913-a8539238245b?q=80&w=2070',
            link: '/dashboard'
        },
        {
            title: 'Corporate Engagement',
            description: 'Boost team spirit and productivity with our dynamic employee engagement through sports programs for corporates and businesses',
            cta: 'Know More',
            image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070',
            link: '/dashboard'
        },
        {
            title: 'Rush Tournaments',
            description: 'Experience the thrill of competition and camaraderie in our exciting tournaments & leagues open for all to join and participate',
            cta: 'Upcoming Tournaments',
            image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2086',
            link: '/dashboard'
        }
    ];

    return (
        <div className="landing-page">
            {/* Navigation Header */}
            <header className="landing-nav">
                <div className="nav-container">
                    <div className="logo">
                        <img src="/Rush-logo.webp" alt="Rush" className="rush-logo-img" />
                    </div>
                    <nav className="nav-links">
                        <a href="#home">HOME</a>
                        <a href="#academy">ACADEMY</a>
                        <a href="#arena">RUSH ARENA</a>
                        <a href="#pickleball">PICKLEBALL</a>
                        <a href="#corporate">CORPORATE ENGAGEMENT</a>
                    </nav>
                    <button className="nav-book-btn" onClick={() => navigate('/dashboard')}>
                        Book Now
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section" id="home">
                <div className="hero-diagonal-bg"></div>
                <div className="hero-content-wrapper">
                    <div className="hero-text">
                        <motion.h1
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            For all things <span className="highlight">sport.</span>
                        </motion.h1>
                        <motion.p
                            className="hero-subtitle"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            Arena. Academy. Events.
                        </motion.p>
                        <motion.button
                            className="hero-cta"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            onClick={() => navigate('/dashboard')}
                        >
                            Book a Court
                        </motion.button>
                    </div>
                    <div className="hero-image">
                        <img
                            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2035"
                            alt="Athletes in action"
                        />
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="services-section" id="arena">
                <div className="services-grid">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            className="service-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                        >
                            <div className="service-image">
                                <img src={service.image} alt={service.title} />
                                <div className="service-overlay"></div>
                            </div>
                            <div className="service-content">
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                                <button
                                    className="service-cta"
                                    onClick={() => navigate(service.link)}
                                >
                                    {service.cta}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Uncouch Branding Section */}
            <section className="uncouch-section">
                <div className="uncouch-content">
                    <h2 className="uncouch-text">uncouch.</h2>
                </div>
            </section>

            {/* Top Clients Section */}
            <section className="clients-section">
                <h2>Our Top Clients</h2>
                <div className="clients-marquee">
                    <div className="marquee-content">
                        {['Microsoft', 'Google', 'Amazon', 'Infosys', 'Wipro', 'TCS', 'Accenture', 'Deloitte'].map((client, i) => (
                            <div key={i} className="client-logo">{client}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-main">
                        <div className="footer-cta">
                            <h2>Stay in the loop</h2>
                            <p>Sign up to book your court and receive updates.</p>
                            <button
                                className="footer-signup-btn"
                                onClick={() => navigate('/login')}
                            >
                                Sign Up
                            </button>
                        </div>
                        <div className="footer-contact">
                            <h3>Addrush Sports Private Limited</h3>
                            <p className="address">
                                # 643/2, 12th Main Rd, 2nd Block, Rajajinagar,<br />
                                Bengaluru, Karnataka 560010
                            </p>
                            <p className="email">
                                <a href="mailto:harsha@myrush.in">harsha@myrush.in</a>
                            </p>
                            <p className="phone">+91 7624898999</p>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <div className="social-links">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube</a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                        </div>
                        <p className="copyright">© 2026 Addrush Sports Private Limited. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
