import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function toTitleCaseWithSpaces(slug) {
  if (!slug) return slug;
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const categoryParam = url.searchParams.get("category"); // e.g. "skin-care"

    // base filter
    const where = {
      inStock: true,
      // if store is a relation, use "is"
      store: { is: { isActive: true } },
    };

    // IMPORTANT: "mode" doesn't work with `in:` arrays. Use OR + equals.
    if (categoryParam) {
      const slug = categoryParam;                               // "skin-care"
      const spaced = categoryParam.replace(/-/g, " ");          // "skin care"
      const title = toTitleCaseWithSpaces(categoryParam);       // "Skin Care"

      where.OR = [
        { category: { equals: slug,   mode: "insensitive" } },
        { category: { equals: spaced, mode: "insensitive" } },
        { category: { equals: title,  mode: "insensitive" } },
      ];
    }

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
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
