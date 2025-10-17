// app/api/order/confirm/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ ok: false, error: "missing_payment_fields" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("[order-confirm] missing RAZORPAY_KEY_SECRET");
      return NextResponse.json({ ok: false, error: "payment_unavailable" }, { status: 500 });
    }

    // verify signature: expected = hmac_sha256(razorpay_order_id + '|' + razorpay_payment_id, secret)
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expected = hmac.digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("[order-confirm] invalid signature", { expected, got: razorpay_signature });
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
    }

    // ✅ atomic transaction: confirm payment + order + decrement stock
    const txResult = await prisma.$transaction(async (tx) => {
      // --- find payment ---
      const payment = await tx.payment.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
      });
      if (!payment) throw new Error("payment_not_found");

      // --- update payment ---
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          signature: razorpay_signature,
          status: "SUCCESS",
        },
      });

      // --- update order status ---
      const order = await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PROCESSING",
          razorpayId: razorpay_order_id,
        },
        include: { orderItems: true },
      });

      // --- decrement stock for each product in order ---
      for (const item of order.orderItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) continue;

        const newStock = Math.max((product.stock || 0) - item.quantity, 0);

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            inStock: newStock > 0,
          },
        });
      }

      return { ok: true, orderId: order.id };
    });

    // ✅ success
    return NextResponse.json({
      ok: true,
      message: "payment_verified_and_stock_updated",
      order: { id: txResult.orderId },
    });
  } catch (err) {
    console.error("[order-confirm] error:", err);
    const isKnown =
      typeof err.message === "string" && err.message === "payment_not_found";
    if (isKnown)
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });

    return NextResponse.json(
      {
        ok: false,
        error: "internal_server_error",
        message:
          "Could not verify payment or update stock. Try again or contact support.",
      },
      { status: 500 }
    );
  }
}
