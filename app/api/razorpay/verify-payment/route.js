import crypto from "crypto";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      total,
      addressId,
      gst,
      shipping,
      subtotal
    } = body;

    // Validate payload
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !Array.isArray(items)
    ) {
      return NextResponse.json(
        { error: "Invalid payment data" },
        { status: 400 }
      );
    }

    // 🔒 Verify Razorpay signature
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment signature invalid" },
        { status: 400 }
      );
    }

    // 🧾 Create DB order with snapshot pricing
    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        total,
        paymentMethod: "RAZORPAY",
        isPaid: true,
        status: "PAID",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        coupon: {
          gst,
          shipping,
          subtotal,
          total
        },
        orderItems: {
          create: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price, // snapshot price
            name: item.name,   // snapshot name
            image: item.images?.[0] || null, // snapshot image
          })),
        },
      },
    });

    // 🧹 Clear user’s cart after successful payment
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} },
    });

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
    });
  } catch (err) {
    console.error("verify-payment error:", err);
    return NextResponse.json(
      { error: "Server error verifying payment" },
      { status: 500 }
    );
  }
}
