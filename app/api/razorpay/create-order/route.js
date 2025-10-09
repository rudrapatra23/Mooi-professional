// app/api/razorpay/create-order/route.js
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export async function POST(req) {
  try {
    const body = await req.json();
    // expect { amount, currency = 'INR', items?: [...], customer?: {name,email,contact} }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const currency = body.currency || "INR";

    // create a DB order (pending)
    const dbOrder = await prisma.order.create({
      data: {
        total: amount,
        paymentMethod: "RAZORPAY", // keep consistent with your schema
        isPaid: false,
        // optional: add other fields like customerId, storeId, status etc.
      },
    });

    // razorpay amount is in paise
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: dbOrder.id,
      payment_capture: 1, // 1 = auto capture, 0 = manual capture
    };

    const rorder = await razorpay.orders.create(options);

    // save razorpay order id in DB (optional but recommended)
    await prisma.order.update({
      where: { id: dbOrder.id },
      data: { razorpayOrderId: rorder.id },
    });

    return NextResponse.json(
      { razorpayOrder: rorder, dbOrderId: dbOrder.id },
      { status: 200 }
    );
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: err?.message || "Failed to create order" }, { status: 500 });
  }
}
