import React from 'react';
import { motion } from 'framer-motion';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/Button';

export const Store: React.FC = () => {
    const products = [
        {
            id: 1,
            name: 'Rush Official Jersey',
            price: '₹999',
            image: 'https://plus.unsplash.com/premium_photo-1677158913955-h6d8196e3869?q=80&w=2070',
            category: 'Apparel'
        },
        {
            id: 2,
            name: 'Pro Performance Football',
            price: '₹1499',
            image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?q=80&w=2070',
            category: 'Equipment'
        },
        {
            id: 3,
            name: 'Rush Training Shorts',
            price: '₹699',
            image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1962', // Placeholder
            category: 'Apparel'
        },
        {
            id: 4,
            name: 'Sipper Bottle',
            price: '₹299',
            image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=2070',
            category: 'Accessories'
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans">
            <TopNav />
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071"
                        alt="Store Hero"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 text-center max-w-4xl px-6 mt-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md text-xs font-bold text-primary tracking-[0.2em] uppercase"
                    >
                        Official Merchandise
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-black font-heading uppercase tracking-tighter text-white mb-6 leading-[0.9]"
                    >
                        Equip Your <br /> <span className="text-primary italic">Game.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto"
                    >
                        Pro-grade gear for every athlete. Shop the latest collection now.
                    </motion.p>
                </div>
            </section>

            <div className="py-20 px-6 max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-black font-heading uppercase text-black">New <span className="text-primary">Arrivals</span></h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {products.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group cursor-pointer"
                        >
                            <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-4">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {product.category}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold uppercase leading-tight mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900 font-black">{product.price}</span>
                                <Button variant="secondary" size="sm" className="rounded-lg text-xs font-bold uppercase">Add to Cart</Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
