import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

/**
 * Strict single-vendor order create:
 * - Recomputes totals server-side from product prices
 * - Compares with client total (tolerance 0.5)
 * - Logs computed vs client totals
 * - Creates order, orderItems, payment atomically
 *
 * Added debug logs to help diagnose total mismatches (no variable renames).
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

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    console.log("[order-create] raw body:", JSON.stringify(body));

    const addressId = parseAddressId(body);
    const paymentMethod = (body.paymentMethod ?? body.payment ?? body.method ?? "").toUpperCase();
    const rawItems = tryGetItems(body);
    const clientTotal = typeof body.total === "number" ? Number(body.total) : null;

    // keep client-provided GST (monetary) for logging/diagnosis, but don't treat it as a rate automatically
    const clientGstMonetary = (typeof body.gst === "number" && body.gst > 1) ? Number(body.gst) : null;
    const clientShipping = typeof body.shipping === "number" ? Number(body.shipping) : null;

    if (!addressId || !paymentMethod || !Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ ok: false, error: "missing_order_details" }, { status: 400 });
    }

    // Normalize and compute subtotal using authoritative DB prices
    let subtotal = 0;
    const normalized = [];
    for (const it of rawItems) {
      const productId = it.id ?? it.productId ?? (it.product && (it.product.id || it.product._id));
      const qty = Number(it.quantity ?? it.qty ?? 1);
      if (!productId) return NextResponse.json({ ok: false, error: "invalid_item", message: "item missing id" }, { status: 400 });

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return NextResponse.json({ ok: false, error: "product_not_found", message: `Product ${productId} not found` }, { status: 404 });

      const price = Number(product.price ?? it.price ?? 0);
      normalized.push({ productId, quantity: qty, price });
      subtotal += price * qty;
    }

    // server-side totals
    const SHIPPING_FEE = Number(body.shipping ?? 99);

    // Robust GST handling:
    // - Prefer explicit body.gstRate when provided.
    // - If body.gst is present and <= 1 (e.g. 0.18) treat it as a rate (backwards compat).
    // - If body.gst is > 1, treat it as a monetary gst amount provided by client (do NOT use as rate).
    // - Default rate = 0.18
    const GST_RATE = (typeof body.gstRate === 'number')
      ? Number(body.gstRate)
      : (typeof body.gst === 'number' && body.gst <= 1)
        ? Number(body.gst)
        : 0.18;

    const gstAmount = parseFloat((subtotal * GST_RATE).toFixed(2));

    // DEBUG: log gst/raw values and types to diagnose mismatches
    console.log("[order-create][debug] body.gst:", body?.gst, "typeof:", typeof body?.gst);
    console.log("[order-create][debug] body.gstRate:", body?.gstRate, "typeof:", typeof body?.gstRate);
    console.log("[order-create][debug] chosen GST_RATE:", GST_RATE, "subtotal:", subtotal, "gstAmount:", gstAmount, "SHIPPING_FEE:", SHIPPING_FEE, "discount:", Number(body.discount ?? 0));

    // If client sent a monetary GST value, log it for debugging but do not use it for calculations.
    if (clientGstMonetary !== null) {
      console.log("[order-create] client provided gst monetary amount:", clientGstMonetary, " — server computed gst based on rate:", gstAmount);
    }

    const total = parseFloat((subtotal + gstAmount + SHIPPING_FEE - (Number(body.discount ?? 0))).toFixed(2));

    // debug log for every request (searchable)
    console.log("[order-create] computedTotals:", {
      subtotal: Number(subtotal.toFixed(2)),
      shipping: Number(SHIPPING_FEE.toFixed(2)),
      gst: gstAmount,
      discount: Number(body.discount ?? 0),
      total,
      clientTotal,
      clientGst: (typeof body.gst === 'number' ? Number(body.gst) : null),
      clientShipping,
      paymentMethod,
      userId,
    });

    // if client provided total, compare within small tolerance (0.5 INR)
    if (clientTotal !== null) {
      const diff = Math.abs(clientTotal - total);
      if (diff > 0.5) {
        console.warn("[order-create] client total mismatch - rejecting", { clientTotal, serverTotal: total, diff });
        // Provide extra debug output so you can see what the server expected
        return NextResponse.json({
          ok: false,
          error: "total_mismatch",
          message: "Order total mismatch (client vs server)",
          serverTotal: total,
          clientTotal,
          debug: {
            subtotal: Number(subtotal.toFixed(2)),
            gstRateUsed: GST_RATE,
            gstAmount,
            shipping: Number(SHIPPING_FEE.toFixed(2)),
            discount: Number(body.discount ?? 0),
            items: normalized
          }
        }, { status: 400 });
      }
    }

    // Now create DB rows in transaction
    const orderData = {
      userId,
      addressId,
      subtotal: parseFloat(subtotal.toFixed(2)),
      shipping: parseFloat(SHIPPING_FEE.toFixed(2)),
      gst: gstAmount,
      discount: Number(body.discount ?? 0),
      total,
      currency: body.currency ?? "INR",
      itemsJson: JSON.stringify(normalized),
      addressJson: null,
      status: paymentMethod === "COD" ? "ORDER_PLACED" : "PENDING",
      paymentMethod,
    };

    // optional: try fetch address and include JSON
    try {
      const addr = await prisma.address.findUnique({ where: { id: addressId } });
      if (addr) orderData.addressJson = JSON.stringify(addr);
    } catch (e) {}

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({ data: orderData });
      if (normalized.length) {
        const itemsToInsert = normalized.map(it => ({
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

      return { order, payment };
    });

    // Razorpay flow: create razor order and attach id
    if (paymentMethod === "RAZORPAY") {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("[order-create] razorpay not configured");
        return NextResponse.json({ ok: false, error: "payment_unavailable" }, { status: 500 });
      }
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const razorOrder = await razorpay.orders.create({ amount: Math.round(result.order.total * 100), currency: "INR", receipt: `rcpt_${result.order.id}` });

      await prisma.payment.updateMany({ where: { orderId: result.order.id }, data: { razorpayOrderId: razorOrder.id, status: "PENDING" } });

      const fullOrder = await prisma.order.findUnique({
        where: { id: result.order.id },
        include: { orderItems: { include: { product: true } }, payments: true, address: true, buyer: true },
      });

      return NextResponse.json({
        ok: true,
        message: "payment_initiated",
        razorpayOrderId: razorOrder.id,
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order: { id: fullOrder.id }
      });
    }

    // COD: clear cart and return
    await prisma.user.update({ where: { id: result.order.userId }, data: { cart: {} } });

    const fullOrder = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: { orderItems: { include: { product: true } }, payments: true, address: true, buyer: true },
    });

    return NextResponse.json({ ok: true, message: "order_created", order: { id: fullOrder.id } });
  } catch (err) {
    console.error("[order-create] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
