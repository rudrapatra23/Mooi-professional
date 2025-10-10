// app/api/razorpay/verify-payment/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const { userId, isSignedIn } = await auth();
    if (!isSignedIn) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      localOrderId, // optional, helps locate the order in your DB
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // verify signature: hmac_sha256(order_id + '|' + payment_id, secret) == razorpay_signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.warn("Invalid signature", { generated_signature, razorpay_signature });
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
    }

    // signature valid — record payment
    // find local order either by razorpayId or localOrderId
    const order = localOrderId
      ? await prisma.order.findUnique({ where: { id: localOrderId } })
      : await prisma.order.findUnique({ where: { razorpayId: razorpay_order_id } });

    if (!order) {
      console.warn("Local order not found for", razorpay_order_id);
      // create a minimal order record or return error per your policy
    }

    // record payment
    const payment = await prisma.payment.create({
      data: {
        orderId: order ? order.id : null,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        method: body.method || null,
        amount: Number(body.amount || 0) / 100, // if amount passed in paise
        currency: body.currency || "INR",
        status: "captured", // or check response to set correct status
        signature: razorpay_signature,
        metaJson: JSON.stringify(body),
      },
    });

    // update order status to 'paid'
    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "paid" },
      });
    }

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error("verify-payment error:", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to verify" }, { status: 500 });
  }
}
