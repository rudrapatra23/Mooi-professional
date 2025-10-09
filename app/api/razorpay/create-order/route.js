// app/api/razorpay/create-order/route.js
import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { total } = await req.json();
    if (!total || total <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { userId },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 });
  }
}
