// client-side JS
export async function startRazorpayCheckout(amount) {
  try {
    // 1) call server to create an order
    const createResp = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }) // amount in rupees
    });
    const data = await createResp.json();
    if (!createResp.ok) throw new Error(data.error || "Failed to create order");

    const { razorpayOrder, dbOrderId } = data;

    // 2) load Razorpay checkout script if not present
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // from env (public)
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Mooi Salon",
      description: "Order payment",
      order_id: razorpayOrder.id,
      handler: async function (response) {
        // response has razorpay_payment_id, razorpay_order_id, razorpay_signature
        // 3) Verify server-side
        await fetch("/api/razorpay/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...response,
            dbOrderId,
          }),
        });

        // show success UI / redirect
        alert("Payment successful — thank you!");
      },
      modal: {
        ondismiss: function () {
          // user closed the checkout — handle cancellation if needed
          console.log("User closed Razorpay modal");
        },
      },
      prefill: {
        // optional: you can pass name, email, contact
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error("checkout error:", err);
    alert(err.message || "Payment failed to start");
  }
}
