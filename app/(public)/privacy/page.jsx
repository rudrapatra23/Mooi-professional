'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Clock, Mail } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero */}
      <section className="border-b border-black py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">
              MOOI PROFESSIONAL
            </span>
            <h1 className="mt-4 text-4xl md:text-6xl font-serif font-bold uppercase tracking-tight">
              Privacy Policy
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-16 h-[2px] bg-black mx-auto my-6"
            />
            <p className="text-gray-500 max-w-lg mx-auto">
              Clear, concise information about how we handle your data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Summary Cards */}
      <section className="py-16 border-b border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <InfoCard icon={<ShieldCheck className="h-5 w-5" />} title="Summary">
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Minimal data collected to fulfill orders</li>
                <li>• Payment details handled by Razorpay</li>
                <li>• No analytics or ad trackers enabled</li>
              </ul>
            </InfoCard>

            <InfoCard icon={<Users className="h-5 w-5" />} title="What We Collect">
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Account info: name, email (via Clerk)</li>
                <li>• Order details: address, phone, history</li>
                <li>• Support: messages and emails you send</li>
              </ul>
            </InfoCard>

            <InfoCard icon={<Clock className="h-5 w-5" />} title="Retention & Security">
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Transactional data retained as legally required</li>
                <li>• Account deletion removes personal data</li>
                <li>• Standard security measures in place</li>
              </ul>
            </InfoCard>
          </motion.div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="space-y-12"
          >
            <Section title="Cookies & Tracking">
              <ul className="space-y-2 text-gray-600">
                <li>• No analytics or advertising trackers enabled by default</li>
                <li>• If we add tracking, we will update this policy and notify users</li>
              </ul>
            </Section>

            <Section title="Third-Party Services">
              <ul className="space-y-2 text-gray-600">
                <li>• <strong>Clerk</strong> — Authentication and account management</li>
                <li>• <strong>Razorpay</strong> — Prepaid payment processing</li>
                <li>• <strong>Logistics partners</strong> — Delivery and shipping fulfilment</li>
              </ul>
            </Section>

            <Section title="Your Rights">
              <ul className="space-y-2 text-gray-600">
                <li>• Access or correct personal data by emailing us</li>
                <li>• Request deletion — we'll comply where legally permitted</li>
                <li>• Some transactional records may be retained as required by law</li>
              </ul>
            </Section>

            <Section title="Children">
              <ul className="space-y-2 text-gray-600">
                <li>• Our services are not intended for children under 13</li>
                <li>• If we learn we collected a child's data, we will delete it promptly</li>
              </ul>
            </Section>

            {/* Contact CTA */}
            <motion.div
              variants={fadeUp}
              className="border border-black p-8 text-center"
            >
              <Mail className="h-6 w-6 mx-auto mb-4" />
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Questions?</h3>
              <p className="text-gray-600 mb-4">We're happy to help with any privacy concerns.</p>
              <a
                href="mailto:info@mooiprofessional.com"
                className="inline-block bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
              >
                Contact Us
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, children }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group border border-black p-6 hover:bg-black hover:text-white transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 border border-current flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
          {icon}
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest">{title}</h3>
      </div>
      <div className="group-hover:text-gray-300 transition-colors">{children}</div>
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <motion.div variants={fadeUp}>
      <h3 className="text-lg font-bold uppercase tracking-widest mb-4 pb-2 border-b border-black">
        {title}
      </h3>
      <div>{children}</div>
    </motion.div>
  );
}
