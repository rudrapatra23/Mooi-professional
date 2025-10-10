// app/api/razorpay/create-order/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma"; // your prisma client
import { auth } from "@clerk/nextjs/server"; // optional, if using Clerk

const rp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    // optional: require signed-in user
    const { userId, isSignedIn } = await auth();
    if (!isSignedIn) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    // expected: { subtotal, shipping, gst, coupon, items, addressId }
    // Validate and recompute total server-side based on items/prices from DB (do not trust client)
    const subtotal = Number(body.subtotal || 0);
    const shipping = Number(body.shipping || 0);
    const gst = Number(body.gst || 0);
    const discount = Number(body.discount || 0);
    const total = Math.round((subtotal + shipping + gst - discount) * 100) / 100; // rupees

    // Razorpay expects amount in paise (smallest currency unit)
    const amountInPaise = Math.round(total * 100);

    if (amountInPaise <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    // create order in Razorpay
    const razorpayOrder = await rp.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
      notes: {
        userId: userId || "guest",
        // add other notes (max 15 key-value)
      },
    });

    // create local DB order (status created)
    const order = await prisma.order.create({
      data: {
        razorpayId: razorpayOrder.id,
        userId: userId || null,
        subtotal,
        shipping,
        gst,
        discount,
        total,
        currency: "INR",
        itemsJson: JSON.stringify(body.items || []),
        addressJson: body.address ? JSON.stringify(body.address) : null,
        status: "created",
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      localOrderId: order.id,
    });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
