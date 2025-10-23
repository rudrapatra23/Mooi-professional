// app/api/orders/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// Admin check helper
async function isAdmin(userId) {
  if (!userId) return false;
  
  // Check if user is in ADMIN_USER_IDS
  const adminUserIds = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  
  if (adminUserIds.includes(userId)) return true;
  
  // Add other admin checks here if needed (email-based, etc.)
  return false;
}

/**
 * GET /api/orders
 * - With ?admin=true -> Admin listing (all orders)
 * - Without -> User's own orders
 */
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const isAdminList = url.searchParams.get("admin") === "true";
    const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 200);
    const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0);

    // ----------------------
    // Admin listing
    // ----------------------
    if (isAdminList) {
      const userIsAdmin = await isAdmin(userId);
      if (!userIsAdmin) {
        return NextResponse.json({ ok: false, error: "Unauthorized - Admin only" }, { status: 401 });
      }

      try {
        const orders = await prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take,
          skip,
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    mrp: true,
                    price: true,
                    images: true,
                    category: true,
                  },
                },
              },
            },
            address: true,
            payments: true,
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        const mapped = orders.map(o => {
          const { buyer, ...rest } = o;
          return { ...rest, user: buyer ?? null };
        });

        return NextResponse.json({ ok: true, orders: mapped }, { status: 200 });
      } catch (dbErr) {
        console.error("[GET /api/orders][admin] DB error:", dbErr);
        return NextResponse.json({
          ok: false,
          error: "database_unavailable",
          message: "Cannot fetch orders. Check server logs.",
        }, { status: 503 });
      }
    }

    // ----------------------
    // User's own orders
    // ----------------------
    try {
      const userOrders = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  mrp: true,
                  price: true,
                  images: true,
                  category: true,
                  inStock: true,
                  stock: true,
                },
              },
            },
          },
          address: true,
          payments: true,
        },
      });

      const items = userOrders.map(o => {
        const mappedItems = (o.orderItems || []).map(it => {
          const productMeta = it.product
            ? {
                id: it.product.id,
                name: it.product.name,
                description: it.product.description,
                mrp: it.product.mrp,
                images: it.product.images,
                price: it.product.price,
              }
            : null;

          const price = Number(it.price ?? 0);
          const quantity = Number(it.quantity ?? 0);
          const lineTotal = Number((price * quantity).toFixed(2));

          return {
            id: it.productId ? `${o.id}::${it.productId}` : it.id,
            productId: it.productId,
            name: productMeta?.name ?? null,
            quantity,
            price,
            lineTotal,
            product: productMeta,
          };
        });

        return {
          id: o.id,
          createdAt: o.createdAt,
          status: o.status,
          paymentMethod: o.paymentMethod,
          total: Number(o.total ?? 0),
          subtotal: Number(o.subtotal ?? 0),
          shipping: Number(o.shipping ?? 0),
          gst: Number(o.gst ?? 0),
          discount: Number(o.discount ?? 0),
          couponCode: o.couponCode || null,
          address: o.address ?? null,
          payments: o.payments ?? [],
          orderItems: mappedItems,
        };
      });

      return NextResponse.json({ ok: true, items }, { status: 200 });
    } catch (dbErr) {
      console.error("[GET /api/orders][user] DB error:", dbErr);
      return NextResponse.json({
        ok: false,
        error: "database_query_failed",
        message: "Failed to fetch your orders.",
        details: dbErr?.message,
      }, { status: 500 });
    }
  } catch (err) {
    console.error("[GET /api/orders] unexpected error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err?.message || "internal" 
    }, { status: 500 });
  }
}

/**
 * PATCH /api/orders
 * Body: { orderId, status }
 * Admin only: update order status
 */
export async function PATCH(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json({ ok: false, error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ ok: false, error: "Missing orderId or status" }, { status: 400 });
    }

    const allowedStatuses = ["ORDER_PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "PENDING"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status value" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        orderItems: { include: { product: true } },
        payments: true,
        address: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const { buyer, ...rest } = updatedOrder;
    const resOrder = { ...rest, user: buyer ?? null };

    return NextResponse.json({ ok: true, order: resOrder }, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/orders] error:", err);
    return NextResponse.json({ 
      ok: false, 
      error: err?.message || "internal" 
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}