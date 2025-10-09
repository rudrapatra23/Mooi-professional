// app/api/orders/route.js
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    const { addressId, items, couponCode, paymentMethod } = await request.json();

    if (!addressId || !paymentMethod || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "missing order details" }, { status: 400 });
    }

    // 1) Load products in ONE query (safer & faster)
    const ids = items.map(i => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, price: true, stock: true, name: true },
    });

    if (products.length !== items.length) {
      return NextResponse.json({ error: "Some products not found" }, { status: 400 });
    }

    // 2) Coupon checks
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 400 });
    }

    // New user check
    if (coupon && coupon.forNewUser) {
      const userOrdersCount = await prisma.order.count({ where: { userId } });
      if (userOrdersCount > 0) {
        return NextResponse.json({ error: "Coupon valid for new users" }, { status: 400 });
      }
    }

    // Member check
    const isPlusMember = typeof has === "function" ? !!has({ plan: "plus" }) : false;
    if (coupon && coupon.forMember && !isPlusMember) {
      return NextResponse.json({ error: "Coupon valid for members only" }, { status: 400 });
    }

    // 3) Compute totals
    // Map to get correct price from DB
    const priceMap = new Map(products.map(p => [p.id, p.price]));
    let subtotal = 0;

    for (const item of items) {
      const price = priceMap.get(item.id);
      if (typeof price !== "number") {
        return NextResponse.json({ error: `Invalid price for ${item.id}` }, { status: 400 });
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        return NextResponse.json({ error: `Invalid quantity for ${item.id}` }, { status: 400 });
      }
      subtotal += price * item.quantity;
    }

    // Apply coupon
    if (coupon) {
      subtotal -= (subtotal * coupon.discount) / 100;
    }

    // Shipping fee once if not member
    let shippingFee = 0;
    if (!isPlusMember) {
      shippingFee = 99; // adjust or compute dynamically if needed
    }

    const fullAmount = Number((subtotal + shippingFee).toFixed(2));

    // 4) Create ONE order with nested items
    const orderData = {
      userId,
      addressId,
      total: fullAmount,
      paymentMethod, // Expect values matching your enum, e.g., "COD" or "RAZORPAY" 
      isCouponUsed: !!coupon,
      coupon: coupon ?? {},
      orderItems: {
        create: items.map(i => ({
          productId: i.id,
          quantity: i.quantity,
          price: priceMap.get(i.id),
        })),
      },
    };

    // Stripe path: create order now or after payment? We'll create now & mark paid on webhook, or
    // you can defer creation. Keeping your pattern: create now and pass id to Stripe metadata.
    const order = await prisma.order.create({ data: orderData, select: { id: true } });

    console.log("CREATED_ORDER", order.id, "fullAmount", fullAmount);

    if (paymentMethod === "STRIPE" || paymentMethod === PaymentMethod.STRIPE) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const origin = request.headers.get("origin") || "";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "Order" },
              unit_amount: Math.round(fullAmount * 100),
            },
            quantity: 1,
          },
        ],
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        mode: "payment",
        success_url: `${origin}/loading?nextUrl=orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
          orderId: order.id,
          userId,
          appId: "gocart",
        },
      });

      return NextResponse.json({ session });
    }

    // Non-Stripe (e.g., COD/Razorpay mocked): clear cart immediately
    await prisma.user.update({ where: { id: userId }, data: { cart: {} } });

    return NextResponse.json({ message: "Order placed successfully", orderId: order.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// Get all orders (admin) or user orders (user)
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "not authorized" }, { status: 401 });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page")) || 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit")) || 20, 1), 50);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.trim();

    // Check if admin (you can implement proper admin check here)
    const isAdmin = url.searchParams.get("admin") === "true";

    const where = {
      ...(isAdmin ? {} : { userId }), // Admin sees all, user sees only their orders
      ...(status ? { status } : {}),
      ...(q ? {
        OR: [
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { orderItems: { some: { product: { name: { contains: q, mode: "insensitive" } } } } }
        ]
      } : {})
    };

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          address: { select: { name: true, phone: true, city: true, state: true } },
          orderItems: {
            select: {
              quantity: true,
              price: true,
              product: { select: { id: true, name: true, images: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    console.log("ORDERS_LIST_COUNT", items.length);

    return NextResponse.json({
      total,
      page,
      limit,
      items
    });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Update order status (admin)
export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "not authorized" }, { status: 401 });

    const { orderId, status } = await request.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status are required" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true, status: true }
    });

    console.log("ORDER_STATUS_UPDATED", orderId, status);

    return NextResponse.json({ order });
  } catch (error) {
    console.error("PATCH /api/orders error:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
