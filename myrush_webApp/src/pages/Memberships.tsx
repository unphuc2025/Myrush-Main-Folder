import React from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';
import { FaCheck, FaCrown, FaStar, FaBolt } from 'react-icons/fa';

export const Memberships: React.FC = () => {
    const plans = [
        {
            name: 'Silver',
            price: '₹999',
            period: '/month',
            color: 'bg-gray-200',
            textColor: 'text-gray-800',
            features: [
                '5% Off on all Court Bookings',
                '24h Early Access to Tournament Registration',
                'Free Water Bottle on Signup'
            ],
            recommended: false
        },
        {
            name: 'Gold',
            price: '₹1,999',
            period: '/month',
            color: 'bg-yellow-400',
            textColor: 'text-black',
            features: [
                '10% Off on all Court Bookings',
                'One Free "Pick-Up Game" Pass per month',
                '48h Early Access to Tournaments',
                'Official Rush Jersey (Yearly Plan)'
            ],
            recommended: true
        },
        {
            name: 'Pro Athlete',
            price: '₹4,999',
            period: '/quarter',
            color: 'bg-black',
            textColor: 'text-white',
            features: [
                '20% Off on all Bookings',
                'Unlimited Free Pick-Up Games',
                'Priority Venue Support',
                '1-on-1 Strategy Session with Head Coach'
            ],
            recommended: false
        }
    ];

    const handleSubscribe = (planName: string) => {
        alert(`Redirecting to payment gateway for ${planName} Plan...`);
        // In a real app, this would initialize Razorpay/Stripe
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <TopNav />

            {/* Hero */}
            <section className="relative h-[50vh] flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070"
                        alt="Membership Hero"
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-black/40 to-transparent" />
                </div>
                <div className="relative z-10 text-center px-6 mt-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase"
                    >
                        Join the Elite
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black font-heading uppercase text-white mb-6"
                    >
                        Rush <span className="text-primary italic">Pro</span>
                    </motion.h1>
                    <p className="text-gray-300 text-lg max-w-xl mx-auto">
                        Unlock exclusive perks, discounts, and priority access. Level up your game today.
                    </p>
                </div>
            </section>

            {/* Plans Grid */}
            <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-8 rounded-3xl shadow-xl flex flex-col relative overflow-hidden ${plan.name === 'Pro Athlete' ? 'bg-black text-white border border-gray-800' : 'bg-white text-black'}`}
                        >
                            {plan.recommended && (
                                <div className="absolute top-0 right-0 bg-primary text-black text-xs font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                                    Best Value
                                </div>
                            )}

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 ${plan.color} ${plan.textColor}`}>
                                {plan.name === 'Silver' && <FaStar />}
                                {plan.name === 'Gold' && <FaCrown />}
                                {plan.name === 'Pro Athlete' && <FaBolt />}
                            </div>

                            <h3 className="text-2xl font-black uppercase font-heading mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-8">
                                <span className={`text-4xl font-black ${plan.name === 'Pro Athlete' ? 'text-white' : 'text-black'}`}>{plan.price}</span>
                                <span className="text-gray-500 font-bold ml-2">{plan.period}</span>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${plan.name === 'Pro Athlete' ? 'bg-primary/20 text-primary' : 'bg-green-100 text-green-600'}`}>
                                            <FaCheck className="text-[10px]" />
                                        </div>
                                        <span className={`text-sm font-bold ${plan.name === 'Pro Athlete' ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant={plan.name === 'Gold' ? 'primary' : 'outline'}
                                className={`w-full h-14 font-black uppercase tracking-widest ${plan.name === 'Pro Athlete' ? 'border-gray-700 text-white hover:bg-white hover:text-black' : ''}`}
                                onClick={() => handleSubscribe(plan.name)}
                            >
                                Choose {plan.name}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
