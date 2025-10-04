import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function toTitleCaseWithSpaces(slug = "") {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(_req, { params }) {
  try {
    const raw = params.category || "";           // e.g. "skin-care"
    const spaced = raw.replace(/-/g, " ");       // "skin care"
    const titled = toTitleCaseWithSpaces(raw);   // "Skin Care"

    const where = {
      inStock: true,
      store: { is: { isActive: true } },
      // Use OR + equals + mode:'insensitive' (mode doesn't work with 'in' arrays)
      OR: [
        { category: { equals: raw,    mode: "insensitive" } },
        { category: { equals: spaced, mode: "insensitive" } },
        { category: { equals: titled, mode: "insensitive" } },
      ],
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        rating: {
          select: {
            createdAt: true,
            rating: true,
            review: true,
            user: { select: { name: true, image: true } },
          },
        },
        store: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products/[category] error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
