// app/api/products/best-sellers/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") || 8), 50);

    // 1) Aggregate sold quantity per productId
    const groups = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    if (!groups || groups.length === 0) {
      // fallback: return newest products if no sales yet
      const newest = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          mrp: true,
          images: true,
          category: true,
          stock: true,
          inStock: true,
        },
      });
      return NextResponse.json({ products: newest });
    }

    const productIds = groups.map((g) => g.productId);

    // 2) Fetch products for those ids
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        mrp: true,
        images: true,
        category: true,
        stock: true,
        inStock: true,
      },
    });

    // 3) Preserve order by sold quantity
    const productsOrdered = productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ products: productsOrdered });
  } catch (err) {
    console.error("GET /api/products/best-sellers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
