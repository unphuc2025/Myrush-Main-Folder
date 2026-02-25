import React from 'react';
import { PublicNav } from '../components/PublicNav';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import ScrollIndicator from '../components/ScrollIndicator';


export const Corporate: React.FC = () => {
    const benefits = [
        {
            title: 'Team Building Redefined',
            description: 'Our sports programs go beyond typical team-building exercises. Engaging in friendly competition and sports challenges helps break down barriers, strengthen bonds, and create a cohesive team environment.',
            image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1000' // Runner/Athlete
        },
        {
            title: 'Work-Life Balance',
            description: 'Encouraging employees to participate in sports activities not only promotes physical health but also supports mental well-being. It offers a refreshing break from daily work routines and fosters a positive work-life balance.',
            image: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=1000' // Nature/Free
        },
        {
            title: 'Increased Productivity',
            description: 'Studies show that physically active employees tend to be more focused, energized, and productive. By incorporating sports into your corporate engagement strategy, you can boost employee motivation and drive overall efficiency.',
            image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000' // Office
        },
        {
            title: 'Enhanced Leadership Skills',
            description: 'Sports engagement provides opportunities for individuals to showcase leadership qualities, nurturing potential leaders within the team.',
            image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1000' // Sports action
        },
        {
            title: 'Improved Communication Skills',
            description: 'Through sports, employees learn to communicate effectively on and off the field, enhancing teamwork and problem-solving abilities.',
            image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000' // Discussion/Classroom like
        },
        {
            title: 'Stress Relief and Well-being',
            description: 'Engaging in physical activities helps reduce stress, anxiety, and burnout, leading to healthier and more focused employees.',
            image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=1000' // Badminton/Stress relief
        }
    ];

    const videos = [
        'https://www.youtube.com/embed/pHwahjf2McU',
        'https://www.youtube.com/embed/bOqHVTu7M0M',
        'https://www.youtube.com/embed/5EScPgVBSX4',
        'https://www.youtube.com/embed/7Q3SCKcmtSI'
    ];

    const { scrollY } = useScroll();
    const indicatorOpacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary selection:text-black">
            <PublicNav />

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-start overflow-hidden bg-black px-4 md:px-12 lg:px-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                    <img
                        src="https://images.squarespace-cdn.com/content/v1/6489a5657044a44b13bae65f/205f2470-1857-443f-bd1f-f3d0f64de382/CBAF3FB3-63F5-4A4C-B207-0BA78B372072.jpeg"
                        alt="Corporate Sports Excellence"
                        className="w-full h-full object-cover opacity-60 scale-105"
                    />
                </div>

                <motion.div
                    className="relative z-20 text-left w-full max-w-5xl pt-40 pb-32"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="inline-flex items-center gap-3 mb-6 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-xl"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] font-heading">
                            Corporate Excellence
                        </span>
                    </motion.div>

                    <h1 className="text-3xl md:text-5xl lg:text-7xl text-white mb-8 md:mb-12 leading-[1.1] md:leading-[1.1] tracking-tight font-extrabold font-heading uppercase">
                        Empower <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Your Team</span><br />
                        Through Sports
                    </h1>

                    <p className="text-white/70 text-sm md:text-xl max-w-2xl mb-12 leading-relaxed font-light">
                        Elevate productivity, foster collaboration, and build lasting bonds with our bespoke corporate sports engagement solutions.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start justify-start gap-4 md:gap-6">
                        <Button
                            variant="primary"
                            size="lg"
                            className="bg-primary text-black hover:bg-primary-hover text-sm md:text-base px-6 md:px-10 py-3 md:py-4.5 uppercase tracking-wider font-heading font-bold shadow-glow hover:shadow-glow-strong rounded-xl w-1/2 sm:w-auto"
                            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Enquire Now
                        </Button>
                    </div>
                </motion.div>

                <motion.div style={{ opacity: indicatorOpacity }}>
                    <ScrollIndicator />
                </motion.div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 md:py-32 bg-gray-50">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div className="max-w-3xl">
                            <motion.span
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                            >
                                Value Proposition
                            </motion.span>
                            <h2 className="text-4xl md:text-6xl font-black text-black font-heading uppercase leading-none">
                                Why Choose <span className="text-primary italic">MyRush?</span>
                            </h2>
                        </div>
                        <p className="text-gray-500 text-lg max-w-sm font-light">
                            We don't just organize sports; we build stronger, healthier, and more connected teams.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                className="group relative overflow-hidden bg-white rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-500 flex flex-col h-full border border-gray-100"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="h-56 overflow-hidden shrink-0 relative">
                                    <img
                                        src={benefit.image}
                                        alt={benefit.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                </div>
                                <div className="p-10 text-left flex-1 flex flex-col bg-white">
                                    <h3 className="text-xl font-black text-black mb-4 uppercase tracking-tight font-heading">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed font-light">
                                        {benefit.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Video Section */}
            <section className="py-24 md:py-32 bg-white">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
                    <div className="text-center mb-20">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-primary font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
                        >
                            Corporate Sports Engagement
                        </motion.span>
                        <h2 className="text-4xl md:text-6xl font-black text-black font-heading uppercase leading-none mb-8">
                            In Action: <span className="text-primary italic">Watch Our Videos</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {videos.map((video, idx) => (
                            <motion.div
                                key={idx}
                                className="aspect-video bg-black rounded-xl md:rounded-xl overflow-hidden shadow-premium hover:shadow-premium-hover transition-all duration-500 relative group"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <iframe
                                    src={video}
                                    title={`Corporate Video ${idx + 1}`}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Contact Section */}
            <section id="contact" className="relative bg-black overflow-hidden py-24 md:py-40 border-t border-white/10">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 -right-1/4 w-[120%] h-[120%] bg-gradient-to-bl from-primary/20 via-primary/5 to-transparent rounded-full blur-[120px]" />
                </div>

                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
                        {/* Left Column: Text */}
                        <div className="w-full lg:w-5/12 relative z-20 text-white">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase">
                                    Custom Solutions
                                </div>
                                <h2 className="text-6xl md:text-8xl font-black font-heading leading-tight mb-10 tracking-tighter uppercase italic">
                                    Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Us.</span>
                                </h2>
                                <p className="text-lg text-white/60 font-medium leading-relaxed max-w-lg">
                                    Interested in elevating your corporate team through the power of sports? Reach out to us by filling out the contact form. Our dedicated team will promptly respond to your inquiries and tailor the perfect sports engagement program to meet your organization's needs. Let's create a winning experience together.
                                </p>
                            </motion.div>
                        </div>

                        {/* Right Column: Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="w-full lg:w-6/12 relative z-20"
                        >
                            <form className="space-y-6" onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

                                if (submitBtn) {
                                    submitBtn.disabled = true;
                                    submitBtn.innerText = 'SENDING...';
                                }

                                const data = {
                                    first_name: (form.elements[0] as HTMLInputElement).value,
                                    last_name: (form.elements[1] as HTMLInputElement).value,
                                    email: (form.elements[2] as HTMLInputElement).value,
                                    phone: (form.elements[3] as HTMLInputElement).value,
                                    company: (form.elements[4] as HTMLSelectElement).value,
                                    designation: (form.elements[5] as HTMLInputElement).value,
                                };

                                try {
                                    const response = await apiClient.post('/contact/submit', {
                                        form_type: 'corporate',
                                        name: `${data.first_name} ${data.last_name}`,
                                        email: data.email,
                                        phone: data.phone,
                                        company_name: data.company,
                                        message: `Designation: ${data.designation}`
                                    });
                                    if (response.data.success) {
                                        alert(response.data.message);
                                        form.reset();
                                    } else {
                                        alert('Message failed to send. Please try again.');
                                    }
                                } catch (err) {
                                    alert('Error sending message. Please try again.');
                                } finally {
                                    if (submitBtn) {
                                        submitBtn.disabled = false;
                                        submitBtn.innerText = 'SEND MESSAGE →';
                                    }
                                }
                            }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="First Name (required)"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Last Name (required)"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Work Email</label>
                                    <input
                                        type="email"
                                        placeholder="example@email.com"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="+91 00000 00000"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                    />
                                </div>

                                <div className="space-y-1 relative">
                                    <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Company Name</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm appearance-none cursor-pointer [&>option]:bg-black [&>option]:text-white"
                                        >
                                            <option value="" disabled selected>Select an option</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                            <option value="Still Unsure">Still Unsure</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-bold font-heading uppercase tracking-widest text-primary mb-2">Designation</label>
                                    <p className="text-[10px] font-medium text-white/40 mb-2">Your role in the company</p>
                                    <input
                                        type="text"
                                        placeholder="e.g. HR Manager"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans text-lg backdrop-blur-sm"
                                    />
                                </div>

                                <div className="pt-8 flex justify-start">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-1/2 md:w-auto px-8 md:px-12 py-3 md:py-5 bg-primary text-black rounded-xl uppercase tracking-[0.2em] font-black shadow-glow hover:shadow-glow-strong hover:bg-white transition-all active:scale-95 text-base md:text-lg"
                                    >
                                        Send Message →
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div >
    );
};
