// app/api/order/create/route.js
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Utility to extract items from body
function tryGetItems(body) {
  if (!body) return null;
  if (Array.isArray(body.items) && body.items.length) return body.items;
  if (Array.isArray(body.cart) && body.cart.length) return body.cart;
  if (Array.isArray(body.products) && body.products.length) return body.products;
  if (body.items && typeof body.items === "object" && !Array.isArray(body.items)) {
    const map = body.items;
    return Object.keys(map).map((k) => ({ id: k, quantity: map[k] }));
  }
  return null;
}

function parseAddressId(body) {
  if (!body) return null;
  if (body.addressId) return body.addressId;
  if (body.address && (body.address.id || body.address._id))
    return body.address.id ?? body.address._id;
  return null;
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId)
      return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    console.log("[order-create] raw body:", JSON.stringify(body));

    const addressId = parseAddressId(body);
    const paymentMethod = (body.paymentMethod ?? body.payment ?? "").toUpperCase();
    const rawItems = tryGetItems(body);
    const clientTotal = typeof body.total === "number" ? Number(body.total) : null;

    if (!addressId || !paymentMethod || !Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ ok: false, error: "missing_order_details" }, { status: 400 });
    }

    // Compute subtotal from DB prices
    let subtotal = 0;
    const normalized = [];
    for (const it of rawItems) {
      const productId = it.id ?? it.productId;
      const qty = Number(it.quantity ?? 1);
      if (!productId)
        return NextResponse.json({ ok: false, error: "invalid_item" }, { status: 400 });

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product)
        return NextResponse.json(
          { ok: false, error: "product_not_found", message: `Product ${productId} not found` },
          { status: 404 }
        );

      const price = Number(product.price ?? it.price ?? 0);
      subtotal += price * qty;
      normalized.push({ productId, quantity: qty, price });
    }

    const SHIPPING_FEE = Number(body.shipping ?? 99);
    const GST_RATE = typeof body.gstRate === "number" ? Number(body.gstRate) : 0.18;
    const gstAmount = parseFloat((subtotal * GST_RATE).toFixed(2));

    const total = parseFloat(
      (subtotal + gstAmount + SHIPPING_FEE - Number(body.discount ?? 0)).toFixed(2)
    );

    if (clientTotal !== null && Math.abs(clientTotal - total) > 0.5) {
      return NextResponse.json(
        {
          ok: false,
          error: "total_mismatch",
          message: "Order total mismatch",
          serverTotal: total,
          clientTotal,
        },
        { status: 400 }
      );
    }

    // ✅ Transaction (unchanged logic + minimal COD stock fix)
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          addressId,
          subtotal,
          shipping: SHIPPING_FEE,
          gst: gstAmount,
          discount: Number(body.discount ?? 0),
          total,
          currency: "INR",
          itemsJson: JSON.stringify(normalized),
          status: paymentMethod === "COD" ? "ORDER_PLACED" : "PENDING",
          paymentMethod,
        },
      });

      if (normalized.length) {
        const itemsToInsert = normalized.map((it) => ({
          orderId: order.id,
          productId: it.productId,
          quantity: it.quantity,
          price: it.price,
        }));
        await tx.orderItem.createMany({ data: itemsToInsert, skipDuplicates: true });
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          amount: total,
          currency: "INR",
          status: paymentMethod === "COD" ? "SUCCESS" : "PENDING",
        },
      });

      // 🔥 Added only this part: instant stock decrement for COD
      if (paymentMethod === "COD") {
        for (const item of normalized) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) continue;
          const newStock = Math.max((product.stock || 0) - item.quantity, 0);
          await tx.product.update({
            where: { id: product.id },
            data: { stock: newStock, inStock: newStock > 0 },
          });
        }
      }

      return { order, payment };
    });

    // Razorpay flow (unchanged)
    if (paymentMethod === "RAZORPAY") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("[order-create] razorpay not configured");
        return NextResponse.json({ ok: false, error: "payment_unavailable" }, { status: 500 });
      }

      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const razorOrder = await razorpay.orders.create({
        amount: Math.round(result.order.total * 100),
        currency: "INR",
        receipt: `rcpt_${result.order.id}`,
      });

      await prisma.payment.updateMany({
        where: { orderId: result.order.id },
        data: { razorpayOrderId: razorOrder.id, status: "PENDING" },
      });

      return NextResponse.json({
        ok: true,
        message: "payment_initiated",
        razorpayOrderId: razorOrder.id,
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order: { id: result.order.id },
      });
    }

    // COD fallback (unchanged)
    return NextResponse.json({
      ok: true,
      message: "order_created",
      order: { id: result.order.id },
    });
  } catch (err) {
    console.error("[order-create] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
