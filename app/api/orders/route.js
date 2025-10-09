// app/api/orders/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

// ✅ Initialize Razorpay with env vars
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { addressId, items, paymentMethod, shipping, gst, total } = body;

    if (!addressId || !items?.length)
      return NextResponse.json(
        { error: "Invalid order details" },
        { status: 400 }
      );

    // ✅ Create DB order first
    const dbOrder = await prisma.order.create({
      data: {
        userId,
        addressId,
        total,
        paymentMethod,
        isPaid: false,
        isCouponUsed: false,
      },
    });

    // ✅ If Razorpay payment
    if (paymentMethod === "RAZORPAY") {
      const rorder = await razorpay.orders.create({
        amount: Math.round(total * 100), // convert to paisa
        currency: "INR",
        receipt: dbOrder.id,
        notes: {
          userId,
          orderId: dbOrder.id,
        },
      });

      if (!rorder?.id)
        return NextResponse.json(
          { error: "Failed to create Razorpay order" },
          { status: 500 }
        );

      // store razorpay order id in db
      await prisma.order.update({
        where: { id: dbOrder.id },
        data: { razorpayOrderId: rorder.id },
      });

      return NextResponse.json({
        message: "Razorpay order created",
        razorpayOrder: rorder,
        dbOrderId: dbOrder.id,
      });
    }

    // ✅ COD fallback
    return NextResponse.json(
      { message: "Order placed successfully", dbOrderId: dbOrder.id },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
