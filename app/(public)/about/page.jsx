"use client";

import { motion } from "framer-motion";
import { CheckCircle, FlaskConical, Leaf, Sparkles, Phone, Mail, MessageCircle } from "lucide-react";

// About page for Mooi Professional — focused on Hair Care & Skin Care
// TailwindCSS + Framer Motion animations
// Drop this file in your Next.js app (e.g., app/about/page.jsx or src/pages/about.jsx)
// If using app router, export default as a Client Component.

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export default function About() {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.rose.50),theme(colors.white))]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center"
          >
            <motion.div variants={fadeUp}>
              <p className="text-sm tracking-[0.2em] text-rose-500 font-medium">MOOI PROFESSIONAL</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
                Science + Nature, your everyday luxury
              </h1>
              <p className="mt-4 max-w-2xl text-neutral-600">
                At <span className="font-semibold">Mooi Professional</span>, artistry, science and care
                come together to redefine beauty. Our professional-grade
                <span className="mx-1 font-semibold">Hair Care</span> and
                <span className="mx-1 font-semibold">Skin Care</span> collections are crafted with advanced
                actives and nature’s finest extracts to deliver transformative
                results—turning daily care into a refined self‑care ritual.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Badge>Salon-grade formulas</Badge>
                <Badge>Clean & conscious</Badge>
                <Badge>Sulphate & Paraben free</Badge>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="h-64 w-full rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 shadow-inner md:h-80"
            >
              {/* Decorative shimmer */}
              <motion.div
                initial={{ x: -200 }}
                animate={{ x: 300 }}
                transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                className="pointer-events-none absolute top-10 h-48 w-24 rotate-12 rounded-full bg-white/30 blur-2xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Brand Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <motion.h2 variants={fadeUp} className="text-2xl font-semibold md:text-3xl">
            What makes Mooi different
          </motion.h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Pillar
              icon={<FlaskConical className="h-6 w-6" />}
              title="Advanced Actives"
              desc="Keratin, Redensyl, Retinol, Vitamin C and more—backed by research for visible results."
            />
            <Pillar
              icon={<Leaf className="h-6 w-6" />}
              title="Nature Enriched"
              desc="Botanical extracts nourish while remaining gentle on hair and skin."
            />
            <Pillar
              icon={<Sparkles className="h-6 w-6" />}
              title="Salon Performance"
              desc="Professional-grade care trusted by stylists, loved at home."
            />
            <Pillar
              icon={<CheckCircle className="h-6 w-6" />}
              title="Conscious Care"
              desc="Sulphate-free, paraben-free approach for a clean, luxurious routine."
            />
          </div>
        </motion.div>
      </section>

      {/* Ranges */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <motion.h2 variants={fadeUp} className="text-2xl font-semibold md:text-3xl">
            Our Focused Ranges
          </motion.h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <CategoryCard
              tag="Hair Care"
              title="Smooth. Strengthen. Shine."
              bullets={[
                "Keratin smoothing & frizz control",
                "Vegan Plastia sulphate‑free cleansing",
                "Intense repair: Hair Botox & Spa Cream",
                "Finishing serums for gloss and humidity shield",
              ]}
            />
            <CategoryCard
              tag="Skin Care"
              title="Clarity meets care"
              bullets={[
                "Foaming face wash with lactic acid freshness",
                "Targeted serums: Vitamin C • Kojic • Retinol",
                "Peel‑off masks: Brightening, Anti‑Aging, Anti‑Acne",
                "Clean formulations—effective yet gentle",
              ]}
            />
          </div>
        </motion.div>
      </section>

      {/* Story / Philosophy */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <motion.div
          className="rounded-3xl bg-neutral-50 p-6 md:p-10 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-xl font-semibold md:text-2xl">Our Philosophy</h3>
          <p className="mt-3 text-neutral-700">
            We design products that embody performance, purity and sophistication—
            inspiring confidence and timeless beauty. Every formula aims to elevate
            everyday care into a ritual you look forward to.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ListItem text="Targeted action that repairs from within—beyond surface gloss." />
            <ListItem text="Lightweight textures that hydrate without heaviness." />
            <ListItem text="Protect color & salon treatments; enhance natural shine." />
            <ListItem text="Results that are visible, buildable and long‑lasting." />
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-rose-500 to-rose-400 px-6 py-10 text-white md:flex-row"
        >
          <div>
            <h3 className="text-2xl font-semibold md:text-3xl">Luxury care, perfected for you</h3>
            <p className="mt-1 text-white/90">Explore hair & skin formulas made for real results.</p>
          </div>
          <a
            href="/shop"
            className="inline-flex items-center rounded-2xl bg-white px-5 py-3 font-medium text-rose-600 shadow-sm transition hover:shadow-md"
          >
            Shop now
          </a>
        </motion.div>
      </section>

      {/* Optional: Support strip (keep or remove). If you don’t want Contact in navbar, this sits quietly on About. */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-lg font-semibold">Need help choosing?</h4>
              <p className="text-neutral-600">Talk to us for quick product guidance.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ContactChip icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" href="#" />
              <ContactChip icon={<Mail className="h-4 w-4" />} label="Email" href="mailto:support@mooiprofessional.com" />
              <ContactChip icon={<Phone className="h-4 w-4" />} label="Call" href="tel:+91XXXXXXXXXX" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ children }) {
  return (
    <motion.span
      variants={fadeUp}
      className="inline-flex items-center rounded-full border border-rose-200 bg-white px-3 py-1 text-sm text-rose-600 shadow-sm"
    >
      {children}
    </motion.span>
  );
}

function Pillar({ icon, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3 text-rose-600">
        <div className="rounded-xl bg-rose-50 p-2">{icon}</div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-neutral-600">{desc}</p>
    </motion.div>
  );
}

function CategoryCard({ tag, title, bullets = [] }) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 text-rose-600">
        <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium">{tag}</span>
      </div>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {/* Gloss highlight */}
      <motion.div
        initial={{ x: -200 }}
        whileInView={{ x: 300 }}
        viewport={{ once: true }}
        transition={{ duration: 2.5, ease: "linear" }}
        className="pointer-events-none absolute -top-6 left-10 h-28 w-16 rotate-12 rounded-full bg-rose-100/60 blur-2xl"
      />
    </motion.div>
  );
}

function ListItem({ text }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle className="mt-0.5 h-5 w-5 text-rose-500" />
      <p className="text-neutral-700">{text}</p>
    </div>
  );
}

function ContactChip({ icon, label, href }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm transition hover:shadow-md hover:border-rose-200"
    >
      <span className="text-rose-600">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
