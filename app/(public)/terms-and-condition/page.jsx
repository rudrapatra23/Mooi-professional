'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, CreditCard, Package, Scale, Copyright, Gavel, Mail } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

export default function TermsAndConditionsPage() {
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
              Terms & Conditions
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-16 h-[2px] bg-black mx-auto my-6"
            />
            <p className="text-gray-500 max-w-lg mx-auto">
              Rules for using the site and placing orders — clear and concise.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <ShieldCheck className="h-8 w-8 mx-auto mb-4" />
            <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Quick Summary</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="border-l border-white/30 pl-4">
                <p className="text-gray-300">Orders can be cancelled only before processing begins.</p>
              </div>
              <div className="border-l border-white/30 pl-4">
                <p className="text-gray-300">Shipping fee of ₹99 applies to every order.</p>
              </div>
              <div className="border-l border-white/30 pl-4">
                <p className="text-gray-300">Mooi may refuse orders for fraud or misuse.</p>
              </div>
            </div>
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
            <Section icon={<FileText className="h-5 w-5" />} title="Use of Website">
              <ul className="space-y-2 text-gray-600">
                <li>• Use the site only for lawful purposes</li>
                <li>• Do not attempt unauthorized access or data scraping</li>
                <li>• Respect intellectual property and content ownership</li>
              </ul>
            </Section>

            <Section icon={<ShieldCheck className="h-5 w-5" />} title="Account & Security">
              <ul className="space-y-2 text-gray-600">
                <li>• Keep login details secure — you're responsible for activity on your account</li>
                <li>• Report unauthorized access immediately</li>
                <li>• We reserve the right to suspend accounts that violate terms</li>
              </ul>
            </Section>

            <Section icon={<CreditCard className="h-5 w-5" />} title="Orders & Payments">
              <ul className="space-y-2 text-gray-600">
                <li>• All prices are in INR (Indian Rupees)</li>
                <li>• Razorpay and Cash on Delivery (COD) supported</li>
                <li>• Shipping fee (₹99) is non-refundable unless Mooi is at fault</li>
              </ul>
            </Section>

            <Section icon={<Package className="h-5 w-5" />} title="Cancellations & Returns">
              <ul className="space-y-2 text-gray-600">
                <li>• Cancel before processing via email</li>
                <li>• After processing, requests are reviewed case-by-case</li>
                <li>• Returns accepted only for defects verified by our team</li>
              </ul>
            </Section>

            <Section icon={<Scale className="h-5 w-5" />} title="Limitation of Liability">
              <ul className="space-y-2 text-gray-600">
                <li>• Mooi is not liable for indirect or consequential damages</li>
                <li>• Maximum liability is capped at the product value</li>
              </ul>
            </Section>

            <Section icon={<Copyright className="h-5 w-5" />} title="Intellectual Property">
              <ul className="space-y-2 text-gray-600">
                <li>• All content is owned by Mooi Professional and protected by Indian law</li>
                <li>• Do not reproduce our branding or product content without permission</li>
              </ul>
            </Section>

            <Section icon={<Gavel className="h-5 w-5" />} title="Governing Law">
              <ul className="space-y-2 text-gray-600">
                <li>• These terms are governed by Indian law</li>
                <li>• Disputes are subject to courts in Noida, Uttar Pradesh</li>
              </ul>
            </Section>

            {/* Contact CTA */}
            <motion.div
              variants={fadeUp}
              className="border border-black p-8 text-center"
            >
              <Mail className="h-6 w-6 mx-auto mb-4" />
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Questions?</h3>
              <p className="text-gray-600 mb-4">We're here to clarify any terms or policies.</p>
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

function Section({ icon, title, children }) {
  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-black">
        <div className="w-8 h-8 border border-black flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-bold uppercase tracking-widest">{title}</h3>
      </div>
      <div>{children}</div>
    </motion.div>
  );
}