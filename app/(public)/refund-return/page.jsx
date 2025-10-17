// File: app/refund-policy/page.jsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Truck, XCircle, CheckCircle, DollarSign } from 'lucide-react';

const fadeUp2 = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-800">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.rose.50),theme(colors.white))]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          <motion.div variants={fadeUp2} initial="hidden" animate="show" className="max-w-4xl">
            <p className="text-sm tracking-[0.2em] text-rose-500 font-medium">MOOI PROFESSIONAL</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">Refund & Cancellation Policy</h1>
            <p className="mt-4 text-neutral-600">Short bullet points showing your rules for cancellations, returns and refunds.</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={{ show: { transition: { staggerChildren: 0.06 } } }}>

          <motion.div variants={fadeUp2} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Truck className="h-6 w-6 text-rose-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold">Key points</h3>
                <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                  <li>Shipping fee: <strong>₹99</strong> per order.</li>
                  <li>Cancellations allowed only before the order enters <strong>Processing</strong>.</li>
                  <li>Returns accepted only for defects verified by our team (email with photos within 7 days).</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.section variants={fadeUp2} className="mt-8 space-y-8">
            <SectionBullet title="Order acceptance & processing">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>We verify and accept orders before moving to processing.</li>
                <li>Once processing starts, cancellation is not guaranteed — logistics may already be engaged.</li>
              </ul>
            </SectionBullet>

            <SectionBullet title="Cancellation rules">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Cancel before processing: email <a className="text-rose-600" href="mailto:info@mooiprofessional.com">info@mooiprofessional.com</a>.</li>
                <li>After processing: send a cancellation request — we’ll review but may refuse due to third-party charges.</li>
                <li>COD refusals: customers may be charged return shipping; repeat refusals may disable COD.</li>
              </ul>
            </SectionBullet>

            <SectionBullet title="Returns for defects">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Report defects with photos within <strong>7 days</strong> of delivery.</li>
                <li>Our team inspects and confirms before accepting returns.</li>
              </ul>
            </SectionBullet>

            <SectionBullet title="Refunds">
              <ul className="mt-2 ml-5 list-disc text-neutral-700 space-y-1">
                <li>Refunds go to the original payment method; timing depends on the payment partner.</li>
                <li>Shipping fees are non-refundable unless Mooi is at fault.</li>
              </ul>
            </SectionBullet>

          </motion.section>

          <motion.div variants={fadeUp2} className="mt-10 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
            <h4 className="font-semibold">Contact</h4>
            <p className="mt-2 text-neutral-700">Email <a className="text-rose-600" href="mailto:info@mooiprofessional.com">info@mooiprofessional.com</a> with your order ID and photos.</p>
          </motion.div>

        </motion.div>
      </div>
    </main>
  );
}

function SectionBullet({ title, children }) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2 text-neutral-700">{children}</div>
    </div>
  );
}



