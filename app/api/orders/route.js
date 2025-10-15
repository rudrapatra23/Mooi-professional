// app/api/orders/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/orders
 * Returns { ok: true, items: [...] } for the authenticated user.
 * Uses orderItems.price (frozen) for historic totals.
 */
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 200);
    const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0);

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: {
        orderItems: {
          include: {
            product: {
              // only include fields that exist in your schema
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
                isDeleted: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        address: true,
        payments: true,
      },
    });

    const items = orders.map((o) => {
      const mappedItems = (o.orderItems || []).map((it) => {
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

        const price = Number(it.price ?? 0); // frozen price from orderItem
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
        total: Number(o.total ?? mappedItems.reduce((s, i) => s + i.lineTotal, 0)),
        shipping: Number(o.shipping ?? 0),
        gst: Number(o.gst ?? 0),
        discount: Number(o.discount ?? 0),
        address: o.address ?? (o.addressJson ? JSON.parse(o.addressJson) : null),
        payments: o.payments ?? [],
        orderItems: mappedItems,
      };
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/orders] error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
