import { useState, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { clearCart } from "@/lib/features/cart/cartSlice";

export default function OrderSummary({ totalPrice, items }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();

  const addressList = useSelector((state) => state.address.list);
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const SHIPPING_CHARGE = 5;
  const GST_RATE = 0.18;

  // 🧮 Snapshot calculations
  const gstAmount = useMemo(() => totalPrice * GST_RATE, [totalPrice]);
  const payable = useMemo(
    () => totalPrice + SHIPPING_CHARGE + gstAmount,
    [totalPrice, gstAmount]
  );

  const handlePlaceOrder = async () => {
    if (isPlacing) return;
    setIsPlacing(true);

    try {
      if (!user) return toast.error("Please login to continue");
      if (!selectedAddress) return toast.error("Select an address first");

      const token = await getToken();

      // 1️⃣ Create Razorpay order
      const { data: orderData } = await axios.post(
        "/api/razorpay/create-order",
        { total: payable },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Mooi Professional",
        description: "Secure Payment",
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 2️⃣ Verify payment & create final DB order
            const verifyRes = await axios.post(
              "/api/razorpay/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items,
                total: payable,
                addressId: selectedAddress.id,
                gst: gstAmount,
                shipping: SHIPPING_CHARGE,
                subtotal: totalPrice,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              toast.success("Payment successful!");
              // 🧹 Clear Redux + DB cart
              dispatch(clearCart());
              await axios.post(
                "/api/cart",
                { cart: {} },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              router.push("/orders");
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (err) {
            toast.error("Verification failed. Try again.");
            console.error(err);
          }
        },
        prefill: {
          name: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
          contact: selectedAddress?.phone || "",
        },
        theme: { color: "#0f172a" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function (resp) {
        toast.error("Payment failed: " + resp.error.description);
      });
    } catch (err) {
      console.error("Payment Error:", err);
      toast.error("Something went wrong during payment");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-slate-50/30 border border-slate-200 text-slate-600 text-sm rounded-xl p-7">
      <h2 className="text-xl font-medium text-slate-700 mb-4">Payment Summary</h2>

      {/* Address Section */}
      <div className="my-4 py-3 border-y border-slate-200">
        <p>Address</p>
        {selectedAddress ? (
          <p>
            {selectedAddress.name}, {selectedAddress.city},{" "}
            {selectedAddress.state}, {selectedAddress.zip}
          </p>
        ) : (
          <select
            className="border border-slate-400 p-2 w-full my-3 outline-none rounded"
            onChange={(e) =>
              setSelectedAddress(addressList[e.target.value])
            }
          >
            <option value="">Select Address</option>
            {addressList.map((addr, i) => (
              <option key={i} value={i}>
                {addr.name}, {addr.city}, {addr.state}, {addr.zip}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Payment Summary */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex justify-between mb-1">
          <p>Subtotal:</p>
          <p>{currency}{totalPrice.toFixed(2)}</p>
        </div>
        <div className="flex justify-between mb-1">
          <p>Shipping:</p>
          <p>{currency}{SHIPPING_CHARGE.toFixed(2)}</p>
        </div>
        <div className="flex justify-between mb-1">
          <p>GST (18%):</p>
          <p>{currency}{gstAmount.toFixed(2)}</p>
        </div>
        <div className="flex justify-between font-semibold text-slate-800 border-t mt-2 pt-2">
          <p>Payable:</p>
          <p>{currency}{payable.toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={isPlacing}
        className={`w-full mt-4 py-2.5 rounded text-white transition-all ${
          isPlacing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-slate-700 hover:bg-slate-900"
        }`}
      >
        {isPlacing ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}
