'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, BookOpen } from 'lucide-react';

const fadeUp3 = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-800">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.rose.50),theme(colors.white))]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          <motion.div variants={fadeUp3} initial="hidden" animate="show" className="max-w-4xl">
            <p className="text-sm tracking-[0.2em] text-rose-500 font-medium">MOOI PROFESSIONAL</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">Terms &amp; Conditions</h1>
            <p className="mt-4 text-neutral-600">Short, clear bullet points — rules for using the site and placing orders.</p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={{ show: { transition: { staggerChildren: 0.06 } } }}>

          <motion.div variants={fadeUp3} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-rose-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold">Summary (quick)</h3>
                <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                  <li>Orders cancellable only before processing.</li>
                  <li>Shipping fee ₹99 applies to every order.</li>
                  <li>Mooi may refuse or cancel orders for fraud or misuse.</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.section variants={fadeUp3} className="mt-8 space-y-8">
            <Block title="Use of website">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Use the site only for lawful purposes.</li>
                <li>Do not attempt unauthorized access or data scraping.</li>
              </ul>
            </Block>

            <Block title="Account & security">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Keep login details secure — you're responsible for activity on your account.</li>
                <li>Report unauthorized access immediately.</li>
              </ul>
            </Block>

            <Block title="Orders & payments">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Prices in INR. Razorpay and COD supported.</li>
                <li>Shipping (₹99) is non-refundable unless Mooi is at fault.</li>
              </ul>
            </Block>

            <Block title="Cancellations & returns">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Cancel before processing via email.</li>
                <li>After processing, requests are reviewed case-by-case.</li>
                <li>Returns only for defects verified by our team.</li>
              </ul>
            </Block>

            <Block title="Limitation of liability">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Mooi is not liable for indirect or consequential damages.</li>
                <li>Maximum liability capped at product value.</li>
              </ul>
            </Block>

            <Block title="Intellectual property">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>All content is owned by Mooi Professional and protected by law.</li>
                <li>Do not reproduce our branding or product content without permission.</li>
              </ul>
            </Block>

            <Block title="Governing law">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>These terms are governed by Indian law.</li>
                <li>Disputes are subject to courts in Noida, Uttar Pradesh.</li>
              </ul>
            </Block>

          </motion.section>

          <motion.div variants={fadeUp3} className="mt-10 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
            <h4 className="font-semibold">Questions?</h4>
            <p className="mt-2 text-neutral-700">Email <a className="text-rose-600" href="mailto:info@mooiprofessional.com">info@mooiprofessional.com</a>.</p>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

function Block({ title, children }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2 text-neutral-700">{children}</div>
    </div>
  );
}