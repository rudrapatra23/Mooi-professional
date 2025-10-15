"use client";
import { useState } from "react";

export default function PayButton() {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    // 1️⃣ Call backend to create order
    const res = await fetch("/api/order/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: "cmgndlg150000k00445bzgxmz",
        paymentMethod: "RAZORPAY",
        items: [{ id: "cmgndjyji0000lb04tb4gkiui", quantity: 1 }],
        shipping: 99,
        total: 687.82,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.ok) return alert(data.message || "Error creating order");

    // 2️⃣ Open Razorpay popup
    const options = {
      key: data.keyId,
      amount: data.amount, // in paisa
      currency: data.currency,
      name: "Mooi Professional",
      order_id: data.razorpayOrderId,
      handler: function (response) {
        alert("Payment success! ID: " + response.razorpay_payment_id);
        // You can now verify the payment on your backend
      },
      prefill: {
        name: "Test User",
        email: "test@example.com",
        contact: "9999999999",
      },
      theme: { color: "#3399cc" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {loading ? "Creating order..." : "Pay with Razorpay"}
    </button>
  );
}
