// app/api/razorpay/webhook/route.js
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) return NextResponse.json({ error: "No signature header" }, { status: 400 });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(bodyText)
      .digest("hex");

    if (expected !== signature) {
      console.warn("Webhook signature mismatch");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    // example: payload.event === 'payment.captured'
    const event = payload.event;
    if (event === "payment.captured" || event === "payment.authorized") {
      const paymentEntity = payload?.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const amount = paymentEntity?.amount / 100;

      // find DB order by razorpayOrderId (we saved it earlier)
      if (razorpayOrderId) {
        const dbOrder = await prisma.order.findFirst({ where: { razorpayOrderId } });
        if (dbOrder) {
          await prisma.order.update({
            where: { id: dbOrder.id },
            data: {
              isPaid: true,
              razorpayPaymentId,
            },
          });
        } else {
          console.warn("Webhook: cannot find DB order for razorpayOrderId", razorpayOrderId);
        }
      }
    }

    // respond 200
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("webhook error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "Webhook server error" }, { status: 500 });
  }
}
