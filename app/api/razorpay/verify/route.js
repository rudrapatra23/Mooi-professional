// app/api/order/verify/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const body = await req.json();

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("Razorpay secret not configured");
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("Razorpay signature mismatch", { razorpay_order_id, razorpay_payment_id });
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
    }

    // Find payment by razorpay order id
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: razorpay_order_id } });
    if (!payment) {
      return NextResponse.json({ ok: false, error: "payment_not_found" }, { status: 404 });
    }

    // Idempotent update: only update if not already marked SUCCESS
    if (payment.status !== "SUCCESS") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          updatedAt: new Date(),
        },
      });

      // Also update order status atomically if needed
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "ORDER_PLACED" }, // or a status you use for successful payment
      });
    }

    return NextResponse.json({ ok: true, message: "verified" });

  } catch (err) {
    console.error("verify error", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
