// app/api/razorpay/verify-payment/route.js
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, dbOrderId } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !dbOrderId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // verify signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.warn("Razorpay signature mismatch", { generated_signature, razorpay_signature });
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    // mark DB order as paid
    await prisma.order.update({
      where: { id: dbOrderId },
      data: {
        isPaid: true,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        // optional: status: 'paid', paidAt: new Date() etc.
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("verify-payment error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Server error" }, { status: 500 });
  }
}
