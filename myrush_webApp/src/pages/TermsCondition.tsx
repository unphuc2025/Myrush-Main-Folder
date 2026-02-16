import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Footer } from '../components/Footer';
import { PublicNav } from '../components/PublicNav';
import { useAuth } from '../context/AuthContext';

export const TermsCondition: React.FC = () => {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-inter flex flex-col">
            {isAuthenticated ? <TopNav /> : <PublicNav />}

            <main className="flex-grow pt-24 pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-primary">Terms & Conditions</h1>

                        <div className="space-y-8 text-gray-300 leading-relaxed">

                            <section>
                                <p className="mb-4">
                                    We do not collect personal information through myrush.in. The website serves as an informational platform, and any interactions with our services or inquiries are managed through direct communication methods such as phone or email.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">Cookies</h2>
                                <p>
                                    Our website may use cookies to enhance user experience. Cookies are small files stored on your device that help us understand how you interact with our website. You can choose to disable cookies through your browser settings.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">Security</h2>
                                <p>
                                    While we do not collect personal data through the website, we implement appropriate security measures to protect the integrity of the website and any information transmitted through it.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">Refunds/Cancellations Policy</h2>
                                <p className="mb-4">
                                    We strive to ensure that our customers are satisfied with our services. If you are not satisfied with any service booked through direct communication with AddRush Sports Private Limited, you may request a refund or cancellation under the following conditions:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Eligibility:</strong> Refunds or cancellations can be requested within 7 days of service booking.</li>
                                    <li><strong>Process:</strong> To request a refund, please contact our customer support team at <a href="mailto:anto@myrush.in" className="text-primary hover:underline">anto@myrush.in</a> with your booking details.</li>
                                    <li><strong>Timeline:</strong> Once your refund is approved, the amount will be credited to your bank account within 5-7 working days.</li>
                                    <li><strong>Non-Refundable Services:</strong> Please note that certain services, once availed, may be non-refundable. Specific terms will be communicated at the time of booking.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">Pricing in INR</h2>
                                <p className="mb-2">All prices for our services and products are listed in INR (Indian Rupees).</p>
                                <p>All transactions and bookings conducted through direct communication with AddRush Sports Private Limited will be processed in INR.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold text-white mb-3">Shipping Policy</h2>
                                <p className="mb-4">
                                    Since AddRush Sports Private Limited primarily offers sports services and facilities, there is no physical product shipping involved. However, if any merchandise or physical items are sold in the future:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Shipping Areas:</strong> Shipping will be available across India.</li>
                                    <li><strong>Shipping Costs:</strong> Any applicable shipping costs will be communicated at the time of purchase.</li>
                                    <li><strong>Timeline:</strong> Standard shipping timelines will range from 3-7 working days, depending on the location.</li>
                                    <li><strong>Order Tracking:</strong> Customers will be provided with tracking information once the order is dispatched.</li>
                                    <li><strong>Delayed/Lost Shipments:</strong> In the case of a delayed or lost shipment, customers should contact our support team at <a href="mailto:anto@myrush.in" className="text-primary hover:underline">anto@myrush.in</a> for resolution.</li>
                                </ul>
                            </section>

                        </div>
                    </motion.div>
                </div>
            </main>


        </div>
    );
};
