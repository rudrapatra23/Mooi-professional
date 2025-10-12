// app/order-success/page.jsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

export default function OrderSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params?.get('orderId');

  // default: do NOT auto-redirect (user chooses)
  const [autoRedirectActive, setAutoRedirectActive] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [copied, setCopied] = useState(false);
  const [lottieAnim, setLottieAnim] = useState(null);
  const [lottieLoaded, setLottieLoaded] = useState(false);

  // track whether animation finished — we can enable buttons or show CTA
  const [animDone, setAnimDone] = useState(false);
  const countdownRef = useRef(null);

  // load lottie JSON (optional)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/lottie/success.json');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setLottieAnim(json);
          setLottieLoaded(true);
        }
      } catch (e) {
        // ignore, fallback to emoji
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // start / stop auto-redirect countdown
  useEffect(() => {
    if (!autoRedirectActive) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(6);
      return;
    }

    // start countdown
    if (!countdownRef.current) {
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            safeNavigateToOrders();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRedirectActive]);

  const safeNavigateToOrders = async () => {
    try {
      if (orderId) {
        await router.push(`/orders?orderId=${encodeURIComponent(orderId)}`);
        return;
      }
      await router.push('/orders');
    } catch (err) {
      try {
        await router.push('/');
      } catch {
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

  // Called when Lottie finishes (if we can detect). We'll use a timeout fallback too.
  const onAnimComplete = () => {
    setAnimDone(true);
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
          <div className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center">
            {/* Lottie or fallback icon */}
            {lottieLoaded && lottieAnim ? (
              // loop false so plays once
              <div className="w-20 h-20">
                <Lottie
                  animationData={lottieAnim}
                  loop={false}
                  onComplete={onAnimComplete}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            ) : (
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
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

           
          </div>


          {/* small note and ability to cancel */}
          <div className="w-full text-center mt-2">
            <p className="text-xs text-slate-400">
              Tip: You can copy the Order ID or view Orders to track delivery.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
