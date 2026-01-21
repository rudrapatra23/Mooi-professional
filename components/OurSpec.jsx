'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ourSpecsData } from '@/assets/assets';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
        },
    },
};

const OurSpecs = () => {
    return (
        <section className="py-20 md:py-28 border-t border-black bg-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">
                        Why Shop With Us
                    </span>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mt-4 uppercase tracking-tight">
                        Our Specifications
                    </h2>
                    <p className="text-gray-500 mt-4 max-w-xl mx-auto">
                        Top-tier service and convenience to ensure your shopping experience is smooth, secure, and hassle-free.
                    </p>
                </motion.div>

                {/* Spec Cards */}
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    {ourSpecsData.map((spec, index) => (
                        <motion.div
                            variants={fadeUp}
                            key={index}
                            className="group relative border border-black p-8 text-center hover:bg-black hover:text-white transition-all duration-500"
                        >
                            {/* Icon Container */}
                            <div className="w-14 h-14 mx-auto mb-6 border border-current flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                <spec.icon size={24} />
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-4">
                                {spec.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-500 group-hover:text-gray-300 leading-relaxed">
                                {spec.description}
                            </p>

                            {/* Decorative Number */}
                            <span className="absolute top-4 right-4 text-4xl font-serif font-bold text-gray-100 group-hover:text-white/10 transition-colors">
                                0{index + 1}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default OurSpecs;