// app/api/razorpay/webhook/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const body = await req.text(); // raw text needed for signature
  const signature = req.headers.get("x-razorpay-signature") || "";

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expected !== signature) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(body);

  // handle events
  if (payload.event === "payment.captured") {
    const paymentId = payload.payload.payment.entity.id;
    const orderId = payload.payload.payment.entity.order_id;
    const amount = payload.payload.payment.entity.amount;
    // update DB accordingly: set payment.status = captured, order.status = paid, etc.
  }

  return NextResponse.json({ ok: true });
}
