// /app/api/razorpay/create/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Utility to normalize items from request body
function normalizeItems(body) {
  if (!body) return [];
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.cart)) return body.cart;
  if (Array.isArray(body.products)) return body.products;
  if (body.items && typeof body.items === "object") {
    return Object.keys(body.items).map(k => ({ id: k, quantity: body.items[k] }));
  }
  return [];
}

// Utility to get address
function parseAddressId(body) {
  if (!body) return null;
  return body.addressId ?? body.address?.id ?? body.address?._id ?? null;
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 401 });

    const body = await req.json();
    const items = normalizeItems(body);
    const addressId = parseAddressId(body);

    if (!items.length || !addressId) {
      return NextResponse.json({ ok: false, error: "missing_order_details" }, { status: 400 });
    }

    // Compute subtotal dynamically from DB
    let subtotal = 0;
    const normalizedItems = [];

    for (const it of items) {
      const productId = it.id ?? it.productId;
      const quantity = Number(it.quantity ?? 1);

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return NextResponse.json({ ok: false, error: "product_not_found", message: `Product ${productId} not found` }, { status: 404 });

      const price = Number(product.price ?? 0);
      subtotal += price * quantity;
      normalizedItems.push({ productId, quantity, price });
    }

    const shipping = Number(body.shipping ?? 99);
    const GST_RATE = 0.18; // can make dynamic if needed
    const gstAmount = parseFloat((subtotal * GST_RATE).toFixed(2));
    const total = parseFloat((subtotal + gstAmount + shipping - Number(body.discount ?? 0)).toFixed(2));

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        userId,
        addressId,
        subtotal,
        shipping,
        gst: gstAmount,
        discount: Number(body.discount ?? 0),
        total,
        currency: "INR",
        itemsJson: JSON.stringify(normalizedItems),
        status: "PENDING",
        paymentMethod: "RAZORPAY",
      },
    });

    // Create Razorpay order
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[razorpay-create] missing env keys");
      return NextResponse.json({ ok: false, error: "payment_unavailable" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // in paisa
      currency: "INR",
      receipt: `rcpt_${order.id}`,
    });

    // Update payment with razorpay order ID
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: "RAZORPAY",
        amount: total,
        currency: "INR",
        status: "PENDING",
        razorpayOrderId: razorOrder.id,
      },
    });

    return NextResponse.json({
      ok: true,
      razorpayOrderId: razorOrder.id,
      amount: razorOrder.amount,
      currency: razorOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order: { id: order.id },
    });
  } catch (err) {
    console.error("[razorpay-create] error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
