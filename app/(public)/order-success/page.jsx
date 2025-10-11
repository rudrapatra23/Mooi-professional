// app/order-success/page.jsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function OrderSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params?.get('orderId');
  const [countdown, setCountdown] = useState(6);
  const [copied, setCopied] = useState(false);
  const [autoRedirectActive, setAutoRedirectActive] = useState(true);

  useEffect(() => {
    if (!autoRedirectActive) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          // try to navigate safely
          safeNavigateToOrders();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [autoRedirectActive]);

  const safeNavigateToOrders = async () => {
    // try deep-link with orderId first
    try {
      if (orderId) {
        await router.push(`/orders?orderId=${encodeURIComponent(orderId)}`);
        return;
      }
      // otherwise push /orders
      await router.push('/orders');
    } catch (err) {
      // fallback to home if /orders doesn't exist
      try {
        await router.push('/');
      } catch {
        // last resort: full reload to root
        window.location.href = '/';
      }
    }
  };

  const handleContinueShopping = async () => {
    try {
      await router.push('/');
    } catch {
      window.location.href = '/';
    }
  };

  const handleViewOrders = async () => {
    await safeNavigateToOrders();
  };

  const handleCopy = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-slate-50">
      <motion.div
        initial={{ opacity: 0, translateY: 18, scale: 0.98 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="text-2xl font-semibold text-slate-800 text-center">Order Confirmed</h1>
          <p className="text-sm text-slate-500 text-center">Thank you — your order has been placed successfully.</p>

          {orderId && (
            <div className="w-full flex flex-col items-stretch gap-2">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded px-3 py-2 text-xs font-mono">
                <span className="truncate">{orderId}</span>
                <button
                  onClick={handleCopy}
                  className="ml-3 text-sm text-slate-700 px-2 py-1 rounded hover:bg-slate-100 active:scale-95"
                  aria-label="Copy order id"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[12px] text-slate-400">We'll send updates to your order page.</p>
            </div>
          )}

          <div className="w-full mt-2 grid grid-cols-1 gap-3">
            <button
              onClick={handleContinueShopping}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 text-white text-base font-medium touch-manipulation"
            >
              Continue Shopping
            </button>

            <button
              onClick={() => { setAutoRedirectActive(false); handleViewOrders(); }}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-800 bg-white text-base font-medium"
            >
              View Orders {orderId ? `(${countdown}s)` : `(${countdown}s)`}
            </button>
          </div>

          <div className="w-full text-center mt-2">
            <p className="text-xs text-slate-400">
              Tip: Use <strong>View Orders</strong> to track delivery. You will be redirected in {countdown}s.
            </p>
            <button
              onClick={() => setAutoRedirectActive(false)}
              className="mt-2 text-xs text-amber-600 underline"
            >
              Cancel auto-redirect
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
