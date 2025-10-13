// app/(public)/order-success/OrderSuccessClient.jsx
'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

export default function OrderSuccessClient({ serverOrderId = null }) {
  // prefer serverOrderId if present; fallback to client query if necessary
  const params = useSearchParams();
  const router = useRouter();
  const clientOrderId = params?.get('orderId');
  const orderId = serverOrderId ?? clientOrderId;

  const [copied, setCopied] = useState(false);
  const [lottieAnim, setLottieAnim] = useState(null);
  const [lottieLoaded, setLottieLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/lottie/success.json');
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) { setLottieAnim(json); setLottieLoaded(true); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCopy = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { setCopied(false); }
  };

  const handleContinue = async () => {
    try { await router.push('/'); } catch { window.location.href = '/'; }
  };

  const handleViewOrders = async () => {
    try { await router.push('/orders'); } catch { window.location.href = '/orders'; }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleContinue}>Continue Shopping</button>
        <button onClick={handleViewOrders}>View Orders</button>
        {orderId && <button onClick={handleCopy}>{copied ? 'Copied' : 'Copy ID'}</button>}
      </div>

      <div style={{ marginTop: 12 }}>
        {lottieLoaded && lottieAnim ? (
          <div style={{ width: 120, height: 120 }}>
            <Lottie animationData={lottieAnim} loop={false} style={{ width: '100%', height: '100%' }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
