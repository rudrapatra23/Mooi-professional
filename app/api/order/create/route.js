// app/api/order/create/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

/**
 * Single-vendor robust create route:
 *  - Accepts items in multiple shapes (items/cart/products)
 *  - Creates Order row, then OrderItem rows, then Payment row
 *  - Returns full order with relations
 *  - Supports COD and RAZORPAY
 */

function tryGetItems(body) {
  if (!body) return null;
  if (Array.isArray(body.items) && body.items.length) return body.items;
  if (Array.isArray(body.cart) && body.cart.length) return body.cart;
  if (Array.isArray(body.products) && body.products.length) return body.products;
  if (body.items && typeof body.items === "object" && !Array.isArray(body.items)) {
    const map = body.items;
    const arr = Object.keys(map).map(k => ({ id: k, quantity: map[k] }));
    if (arr.length) return arr;
  }
  return null;
}

function parseAddressId(body) {
  if (!body) return null;
  if (body.addressId) return body.addressId;
  if (body.address && (body.address.id || body.address._id)) return body.address.id ?? body.address._id;
  return null;
}

function parsePaymentMethod(body) {
  if (!body) return null;
  return body.paymentMethod ?? body.payment ?? body.method ?? null;
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    console.log("[order-create] getAuth userId:", userId);

    if (!userId) return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    console.log("[order-create] raw body:", JSON.stringify(body));

    const addressId = parseAddressId(body);
    const paymentMethod = parsePaymentMethod(body);
    const rawItems = tryGetItems(body);

    const validation = {
      addressId: !!addressId ? addressId : null,
      paymentMethod: paymentMethod ?? null,
      itemsFound: !!rawItems,
      itemsCount: Array.isArray(rawItems) ? rawItems.length : 0,
    };

    if (!addressId || !paymentMethod || !Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({
        ok: false,
        error: "missing_order_details",
        message: "Request missing one or more required fields",
        validation,
        hint: "Expected: { addressId: string, paymentMethod: 'COD'|'RAZORPAY', items: [{ id, quantity, price? }] }",
      }, { status: 400 });
    }

    // Normalize items and validate product existence
    const normalized = [];
    let subtotal = 0;
    for (const it of rawItems) {
      const productId = it.id ?? it.productId ?? (it.product && (it.product.id || it.product._id));
      const qty = Number(it.quantity ?? it.qty ?? 1);
      if (!productId) {
        return NextResponse.json({ ok: false, error: "invalid_item", message: "Item missing product id", item: it }, { status: 400 });
      }
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ ok: false, error: "product_not_found", message: `Product not found: ${productId}`, item: it }, { status: 404 });
      }
      const price = Number(product.price ?? it.price ?? 0);
      subtotal += price * qty;
      normalized.push({ productId, quantity: qty, price });
    }

    // compute totals
    const SHIPPING_FEE = Number(body.shipping ?? 5);
    const GST_RATE = Number(body.gstRate ?? 0.18);
    const gstAmount = parseFloat((subtotal * GST_RATE).toFixed(2));
    const total = parseFloat((subtotal + gstAmount + SHIPPING_FEE).toFixed(2));

    // serialize items/address as JSON for quick reference (your schema has itemsJson/addressJson)
    const itemsJson = JSON.stringify(normalized);
    let addressJson = null;
    // try to fetch Address from DB if addressId present
    if (addressId) {
      try {
        const addr = await prisma.address.findUnique({ where: { id: addressId } });
        if (addr) addressJson = JSON.stringify(addr);
      } catch (e) {
        // ignore, optional
        addressJson = null;
      }
    }

    // === Create order row first (no nested create) ===
    // use schema fields: subtotal, shipping, gst, discount, total, currency, itemsJson, addressJson, status, paymentMethod
    const orderCreateData = {
      userId,
      addressId,
      subtotal,
      shipping: SHIPPING_FEE,
      gst: gstAmount,
      discount: Number(body.discount ?? 0),
      total,
      currency: body.currency ?? "INR",
      itemsJson,
      addressJson,
      status: paymentMethod === "COD" ? "ORDER_PLACED" : "PENDING",
      paymentMethod: paymentMethod, // relies on enum PaymentMethod in schema
    };

    const order = await prisma.order.create({ data: orderCreateData });
    console.log("[order-create] created order id:", order.id);

    // === create order items (OrderItem model) ===
    // OrderItem model in your schema is composite PK [orderId, productId] with fields: orderId, productId, quantity, price
    const itemsToInsert = normalized.map(it => ({
      orderId: order.id,
      productId: it.productId,
      quantity: it.quantity,
      price: it.price,
    }));

    // createMany for OrderItem (works with composite PK)
    await prisma.orderItem.createMany({
      data: itemsToInsert,
      skipDuplicates: true,
    });

    // === create Payment row ===
    const paymentData = {
      orderId: order.id,
      method: paymentMethod,
      amount: total,
      currency: "INR",
      status: paymentMethod === "COD" ? "SUCCESS" : "PENDING",
    };

    // for Razorpay, create razor order and attach razorpayOrderId
    if (paymentMethod === "RAZORPAY") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return NextResponse.json({ ok: false, error: "razorpay_not_configured" }, { status: 500 });
      }
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const razorOrder = await razorpay.orders.create({
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      });
      paymentData.razorpayOrderId = razorOrder.id;
      paymentData.status = "PENDING";
      // create payment row with razorpayOrderId
      await prisma.payment.create({ data: paymentData });
      // return full order + razorpay info
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { orderItems: { include: { product: true } }, payments: true, address: true, buyer: true },
      });

      console.log("[order-create] razorpay order created:", razorOrder.id);
      return NextResponse.json({
        ok: true,
        message: "Razorpay order created",
        razorpayOrderId: razorOrder.id,
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order: fullOrder,
      });
    }

    // COD payment (create success payment)
    await prisma.payment.create({ data: paymentData });

    // Clear user cart
    await prisma.user.update({ where: { id: userId }, data: { cart: {} } });

    // fetch and return full order with relations
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { orderItems: { include: { product: true } }, payments: true, address: true, buyer: true },
    });

    console.log("[order-create] COD order completed:", JSON.stringify(fullOrder, null, 2));
    return NextResponse.json({ ok: true, message: "Order placed (COD)", order: fullOrder });
  } catch (err) {
    console.error("[order-create] unexpected error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "internal" }, { status: 500 });
  }
}
