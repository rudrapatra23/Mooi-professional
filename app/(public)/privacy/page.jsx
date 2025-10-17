// File: app/privacy-policy/page.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Users, Clock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-800">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.rose.50),theme(colors.white))]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="max-w-4xl">
            <p className="text-sm tracking-[0.2em] text-rose-500 font-medium">MOOI PROFESSIONAL</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">Privacy Policy</h1>
            <p className="mt-4 text-neutral-600">Quick, clear bullets — everything you need to know about your data.</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={{ show: { transition: { staggerChildren: 0.06 } } }}>

          <motion.div variants={fadeUp} className="grid gap-6 md:grid-cols-3">
            <InfoCard icon={<ShieldCheck className="h-5 w-5 text-rose-600"/>} title="Summary">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>We collect minimal data to fulfill orders and provide support.</li>
                <li>Payment card details are handled by Razorpay — we don't store card numbers.</li>
                <li>No analytics or advertising trackers enabled by default.</li>
              </ul>
            </InfoCard>

            <InfoCard icon={<Users className="h-5 w-5 text-rose-600"/>} title="What we collect">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Account: name, email (Clerk).</li>
                <li>Orders: shipping & billing address, phone, order history.</li>
                <li>Support: messages, emails you send us.</li>
              </ul>
            </InfoCard>

            <InfoCard icon={<Clock className="h-5 w-5 text-rose-600"/>} title="Retention & security">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>We retain transactional data as required by law.</li>
                <li>Account deletion removes personal data except limited records we must keep.</li>
                <li>Standard security measures in place — keep passwords secure.</li>
              </ul>
            </InfoCard>
          </motion.div>

          <motion.section variants={fadeUp} className="mt-8 space-y-8">
            <Section title="Cookies & Tracking">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>No analytics or ad trackers enabled by default.</li>
                <li>If we add tracking, we will update this policy and notify users.</li>
              </ul>
            </Section>

            <Section title="Third-party services">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Clerk — authentication and account management.</li>
                <li>Razorpay — prepaid payment processing.</li>
                <li>Logistics partners — delivery and shipping details for fulfilment.</li>
              </ul>
            </Section>

            <Section title="Your rights">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Access or correct personal data by emailing <a className="text-rose-600" href="mailto:info@mooiprofessional.com">info@mooiprofessional.com</a>.</li>
                <li>Request deletion — we'll comply where legally permitted (transactional records may remain).</li>
              </ul>
            </Section>

            <Section title="Children">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Not intended for children under 13.</li>
                <li>If we learn we collected a child's data, we will delete it promptly.</li>
              </ul>
            </Section>

            <Section title="Contact">
              <p className="mt-2 text-neutral-700">Questions? Email <a className="text-rose-600" href="mailto:info@mooiprofessional.com">info@mooiprofessional.com</a>.</p>
            </Section>
          </motion.section>

        </motion.div>
      </div>
    </main>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-rose-50 p-2">{icon}</div>
        <div>
          <h4 className="font-semibold">{title}</h4>
          <div className="mt-2 text-sm text-neutral-600">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2 text-neutral-700">{children}</div>
    </div>
  );
}


