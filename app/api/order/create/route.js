// app/api/order/create/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";
import { z } from "zod";

// request schema
const ItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative().optional(),
});

const CreateOrderSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["COD", "RAZORPAY"]),
  items: z.array(ItemSchema).min(1),
  gst: z.number().nonnegative().optional(),
  shipping: z.number().nonnegative().optional(),
  total: z.number().nonnegative().optional(),
  couponCode: z.string().optional(),
  discount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
});

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
    }

    const parse = CreateOrderSchema.safeParse(body);
    if (!parse.success) {
      // friendly validation message
      const first = parse.error.errors[0];
      return NextResponse.json({
        ok: false,
        error: "validation_error",
        message: first.message,
        field: first.path.join("."),
      }, { status: 400 });
    }

    const { addressId, paymentMethod, items, gst: gstOverride, shipping: shippingOverride, couponCode, discount: discountOverride, currency } = parse.data;

    // normalize & verify products exist and compute subtotal
    const products = [];
    let subtotal = 0;
    for (const it of items) {
      const product = await prisma.product.findUnique({ where: { id: it.id } });
      if (!product) {
        return NextResponse.json({ ok: false, error: "product_not_found", message: "One of the products is not available" }, { status: 404 });
      }
      const price = Number(product.price ?? it.price ?? 0);
      subtotal += price * it.quantity;
      products.push({ productId: it.id, quantity: it.quantity, price });
    }

    const SHIPPING_FEE = Number(shippingOverride ?? 5);
    const GST_RATE = Number(gstOverride ?? 0.18);
    const gstAmount = parseFloat((subtotal * GST_RATE).toFixed(2));
    const finalTotal = parseFloat(((subtotal - Number(discountOverride ?? 0)) + gstAmount + SHIPPING_FEE).toFixed(2));

    // prepare serialized fields
    const itemsJson = JSON.stringify(products);
    let addressJson = null;
    try {
      const addr = await prisma.address.findUnique({ where: { id: addressId } });
      if (addr) addressJson = JSON.stringify(addr);
    } catch (e) {
      addressJson = null;
    }

    // Transaction: create order -> items -> payment (atomic)
    const createResult = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          subtotal: parseFloat(subtotal.toFixed(2)),
          shipping: parseFloat(SHIPPING_FEE.toFixed(2)),
          gst: gstAmount,
          discount: Number(discountOverride ?? 0),
          total: finalTotal,
          currency: currency ?? "INR",
          itemsJson,
          addressJson,
          status: paymentMethod === "COD" ? "ORDER_PLACED" : "PENDING",
          paymentMethod,
        },
      });

      // OrderItems (composite PK)
      const itemsToInsert = products.map(p => ({
        orderId: order.id,
        productId: p.productId,
        quantity: p.quantity,
        price: p.price,
      }));

      // createMany (composite PK supported)
      if (itemsToInsert.length) {
        await tx.orderItem.createMany({ data: itemsToInsert, skipDuplicates: true });
      }

      // payments row (pending for razorpay)
      const paymentRow = await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          amount: finalTotal,
          currency: "INR",
          status: paymentMethod === "COD" ? "SUCCESS" : "PENDING",
        },
      });

      return { order, payment: paymentRow };
    });

    // After transaction: if RAZORPAY, create razor order and update payment. We do this outside transaction
    if (paymentMethod === "RAZORPAY") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // Log server-side but return friendly message
        console.error("[order-create] razorpay not configured");
        return NextResponse.json({ ok: false, error: "payment_unavailable", message: "Payment provider not configured" }, { status: 500 });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const razorOrder = await razorpay.orders.create({
        amount: Math.round(createResult.order.total * 100),
        currency: "INR",
        receipt: `rcpt_${createResult.order.id}_${Date.now()}`,
      });

      // attach razorpayOrderId to payment record
      await prisma.payment.updateMany({
        where: { orderId: createResult.order.id },
        data: { razorpayOrderId: razorOrder.id, status: "PENDING" },
      });

      // fetch full order minimal safe object to return
      const fullOrder = await prisma.order.findUnique({
        where: { id: createResult.order.id },
        include: { orderItems: { include: { product: true } }, payments: true, address: true, buyer: true },
      });

      return NextResponse.json({
        ok: true,
        message: "payment_initiated",
        razorpayOrderId: razorOrder.id,
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order: { id: fullOrder.id },
      });
    }

    // COD: clear cart and return sanitized order
    await prisma.user.update({ where: { id: createResult.order.userId }, data: { cart: {} } });

    const returned = await prisma.order.findUnique({
      where: { id: createResult.order.id },
      include: { orderItems: { include: { product: true } }, payments: true, address: true, buyer: true },
    });

    return NextResponse.json({ ok: true, message: "order_created", order: { id: returned.id } });
  } catch (err) {
    // log server-side, but do NOT send stack trace to client
    console.error("[order-create] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "internal_server_error", message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
