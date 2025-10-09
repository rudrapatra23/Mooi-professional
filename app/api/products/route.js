// app/api/products/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const MAX_LIMIT = 50;
const num = (v, d=0) => Number.isFinite(Number(v)) ? Number(v) : d;
const titleize = (slug="") => slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const page  = Math.max(1, num(url.searchParams.get("page"), 1));
    const limit = Math.min(Math.max(num(url.searchParams.get("limit"), 20), 1), MAX_LIMIT);
    const q = (url.searchParams.get("q") || "").trim();
    const catRaw = (url.searchParams.get("category") || "").trim(); // e.g. "skin-care"

    const whereAND = [];
    if (q) {
      whereAND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (catRaw) {
      const spaced = catRaw.replace(/-/g, " ");
      const titled = titleize(catRaw);
      whereAND.push({
        OR: [
          { category: { equals: catRaw,  mode: "insensitive" } },
          { category: { equals: spaced,  mode: "insensitive" } },
          { category: { equals: titled,  mode: "insensitive" } },
        ],
      });
    }

    const where = whereAND.length ? { AND: whereAND } : {};

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          mrp: true,
          category: true,
          inStock: true,
          images: true,   // keep but show only first on UI
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      total,
      page,
      limit,
      items, // <-- standard key
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
