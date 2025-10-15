// app/api/razorpay/webhook/route.js
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const runtime = "nodejs"; // ensures Node runtime (optional)
export async function POST(req) {
  try {
    const bodyText = await req.text(); // raw text needed for signature verification
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || !signature) {
      console.warn("Webhook not configured or missing signature");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const expected = crypto.createHmac("sha256", webhookSecret).update(bodyText).digest("hex");
    if (expected !== signature) {
      console.warn("Invalid webhook signature");
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;

    // Example: payment.authorized or payment.captured or payment.failed
    if (event === "payment.captured" || event === "payment.authorized") {
      const paymentId = payload.payload?.payment?.entity?.id;
      const razorOrderId = payload.payload?.payment?.entity?.order_id;
      const amount = payload.payload?.payment?.entity?.amount; // in paisa

      // find matching payment by razorpayOrderId
      const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: razorOrderId } });
      if (payment) {
        // idempotent update
        await prisma.payment.updateMany({
          where: { id: payment.id, status: { not: "SUCCESS" } },
          data: { status: "SUCCESS", razorpayPaymentId: paymentId, amountReceived: amount / 100 },
        });
        // update order status
        await prisma.order.updateMany({
          where: { id: payment.orderId, status: { not: "ORDER_PLACED" } },
          data: { status: "ORDER_PLACED" },
        });
      }
    } else if (event === "payment.failed") {
      // handle failures
    } else if (event === "refund.processed") {
      // handle refund events
    }

    // return 200 quickly
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("webhook error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
