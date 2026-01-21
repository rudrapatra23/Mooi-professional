"use client";

import { motion } from "framer-motion";
import { CheckCircle, FlaskConical, Leaf, Sparkles, Award, Star, Shield, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

export default function About() {
  return (
    <div className="min-h-screen bg-white text-black">
      {/* Hero Section - Full Width with Dramatic Typography */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden border-b border-black">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-white" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-4 py-20 max-w-5xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-bold tracking-[0.4em] text-gray-500 uppercase mb-6"
          >
            MOOI PROFESSIONAL
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight leading-none uppercase"
          >
            Our Story
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="w-24 h-[2px] bg-black mx-auto my-8"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Where science meets artistry. Professional-grade formulas crafted for those who demand excellence in every detail.
          </motion.p>
        </motion.div>
      </section>

      {/* Brand Statement */}
      <section className="py-20 md:py-32 border-b border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <motion.div variants={fadeUp}>
              <span className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">The Philosophy</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-4 mb-6 uppercase tracking-tight">
                Beauty Without Compromise
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                At <span className="font-semibold text-black">Mooi Professional</span>, we believe that true luxury lies in the details. Our formulations blend cutting-edge science with nature's finest ingredients to deliver transformative results.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Every product is a testament to our commitment: salon-grade performance, consciously crafted, uncompromising quality.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <Badge>Salon-Grade</Badge>
                <Badge>Clean Beauty</Badge>
                <Badge>Sulphate-Free</Badge>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="relative aspect-[4/5] bg-neutral-100 border border-black overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-serif font-bold">M</p>
                  <p className="text-xs tracking-[0.4em] uppercase mt-2">Since 2020</p>
                </div>
              </div>
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-16 h-16 border-l border-b border-black" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-r border-t border-black" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Pillars */}
      <section className="py-20 md:py-32 bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">Why Choose Us</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-4 uppercase tracking-tight">
                The Mooi Difference
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Pillar
                icon={<FlaskConical className="h-6 w-6" />}
                title="Advanced Actives"
                desc="Keratin, Redensyl, Retinol & Vitamin C—backed by research for visible results."
              />
              <Pillar
                icon={<Leaf className="h-6 w-6" />}
                title="Nature Enriched"
                desc="Botanical extracts that nourish while remaining gentle on hair and skin."
              />
              <Pillar
                icon={<Sparkles className="h-6 w-6" />}
                title="Salon Performance"
                desc="Professional-grade care trusted by stylists, loved at home."
              />
              <Pillar
                icon={<Shield className="h-6 w-6" />}
                title="Conscious Care"
                desc="Sulphate-free, paraben-free approach for a clean, luxurious routine."
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Ranges */}
      <section className="py-20 md:py-32 border-b border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">Collections</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mt-4 uppercase tracking-tight">
                Our Focused Ranges
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <CategoryCard
                tag="Hair Care"
                title="Smooth. Strengthen. Shine."
                bullets={[
                  "Keratin smoothing & frizz control",
                  "Vegan Plastia sulphate-free cleansing",
                  "Intense repair: Hair Botox & Spa Cream",
                  "Finishing serums for gloss and humidity shield",
                ]}
              />
              <CategoryCard
                tag="Skin Care"
                title="Clarity Meets Care"
                bullets={[
                  "Foaming face wash with lactic acid freshness",
                  "Targeted serums: Vitamin C • Kojic • Retinol",
                  "Peel-off masks: Brightening, Anti-Aging, Anti-Acne",
                  "Clean formulations—effective yet gentle",
                ]}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-5xl font-serif font-bold uppercase tracking-tight mb-6">
              Experience The Difference
            </h2>
            <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto">
              Discover why professionals and beauty enthusiasts choose Mooi for their daily rituals.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-black text-white px-12 py-4 text-sm font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Shop Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function Badge({ children }) {
  return (
    <motion.span
      variants={fadeUp}
      className="inline-flex items-center border border-black px-4 py-2 text-xs font-bold uppercase tracking-widest"
    >
      {children}
    </motion.span>
  );
}

function Pillar({ icon, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group text-center p-6 border border-white/20 hover:bg-white hover:text-black transition-all duration-300"
    >
      <div className="w-12 h-12 mx-auto mb-4 border border-current flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-sm font-bold uppercase tracking-widest mb-3">{title}</h3>
      <p className="text-sm text-gray-400 group-hover:text-gray-600 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function CategoryCard({ tag, title, bullets = [] }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group border border-black p-8 md:p-10 hover:bg-black hover:text-white transition-all duration-500"
    >
      <span className="inline-block border border-current px-3 py-1 text-xs font-bold uppercase tracking-widest mb-4">
        {tag}
      </span>
      <h3 className="text-2xl font-serif font-bold uppercase tracking-tight mb-6">{title}</h3>
      <ul className="space-y-3">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-gray-600 group-hover:text-gray-300">{b}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
