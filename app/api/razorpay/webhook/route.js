// app/api/webhooks/razorpay/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * Razorpay webhook receiver.
 * - Verify header x-razorpay-signature with raw body using secret
 * - Handle important events (payment.captured)
 */

export async function POST(req) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) return NextResponse.json({ ok: false }, { status: 400 });

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("[webhook] missing secret");
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    // compute expected signature
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(raw).digest("hex");
    if (expected !== signature) {
      console.warn("[webhook] invalid signature");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const payload = JSON.parse(raw);
    const event = payload.event;
    // handle a few important events
    if (event === "payment.captured" || event === "payment.authorized") {
      const rp = payload.payload?.payment?.entity;
      if (rp && rp.order_id) {
        const razorOrderId = rp.order_id;
        const razorPaymentId = rp.id;
        // Mark payment/order as success (idempotent)
        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.findFirst({ where: { razorpayOrderId: razorOrderId } });
          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                razorpayPaymentId: razorPaymentId,
                status: "SUCCESS",
                signature: signature,
              },
            });
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: "PROCESSING", razorpayId: razorOrderId },
            });
          }
        });
      }
    }

    // always respond 200 quickly to webhook
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
