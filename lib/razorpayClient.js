// lib/razorpayClient.js
export function loadRazorpaySdk() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * createAndOpenRazorpay - create server order then open Razorpay checkout
 * params:
 *  - payload: { items, total, addressId, currency }
 *  - getToken: async fn to get Clerk JWT (used in request header)
 *  - onSuccess(order) - callback invoked after server verifies payment
 *  - onError(message)
 */
export async function createAndOpenRazorpay({ payload, getToken, onSuccess, onError, prefill = {} }) {
  try {
    const sdkLoaded = await loadRazorpaySdk();
    if (!sdkLoaded) {
      onError?.("Razorpay SDK failed to load");
      return;
    }

    const token = await getToken();
    if (!token) {
      onError?.("Not authenticated");
      return;
    }

    const res = await fetch("/api/razorpay/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data?.ok) {
      onError?.(data?.error || "Failed to initialize payment");
      return;
    }

    const { razorpayOrderId, amount, currency, keyId, order } = data;

    const options = {
      key: keyId,
      amount, // in smallest currency unit (paise)
      currency,
      name: "Your Shop Name",
      description: "Order Payment",
      order_id: razorpayOrderId,
      handler: async function (resp) {
        // resp: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        try {
          const token2 = await getToken();
          const verifyRes = await fetch("/api/order/confirm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token2}`,
            },
            body: JSON.stringify({
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_signature: resp.razorpay_signature,
              orderId: order?.id,
            }),
          });
          const verifyJson = await verifyRes.json();
          if (verifyJson?.ok) {
            onSuccess?.(verifyJson.order ?? { id: order?.id });
          } else {
            onError?.(verifyJson?.error || "Verification failed");
          }
        } catch (e) {
          onError?.(e?.message || "Verification error");
        }
      },
      prefill: prefill || {},
      theme: { color: "#111827" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("createAndOpenRazorpay error", err);
    onError?.(err?.message || "Payment initialization failed");
  }
}
