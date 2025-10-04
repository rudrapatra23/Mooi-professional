import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function parseId(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return { by: "number", value: raw };
  const s = String(raw).trim();
  if (s === "") return null;
  if (/^\d+$/.test(s)) return { by: "number", value: Number(s) };
  return { by: "string", value: s };
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request) || {};
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const rawProductId = body?.productId;
    const parsed = parseId(rawProductId);
    if (!parsed) {
      return NextResponse.json({ error: "Missing or invalid productId" }, { status: 400 });
    }

    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

    const where = parsed.by === "number" ? { id: parsed.value } : { id: parsed.value };

    // fetch product first (to know current inStock)
    const product = await prisma.product.findUnique({ where });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (String(product.storeId) !== String(storeId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // atomic update: only update if inStock is still the same
    const updatedCount = await prisma.product.updateMany({
      where: { ...where, inStock: product.inStock },
      data: { inStock: !product.inStock },
    });

    if (updatedCount.count === 0) {
      // another request already toggled it
      const fresh = await prisma.product.findUnique({ where, select: { id: true, inStock: true } });
      return NextResponse.json(
        { message: "Product stock already updated by another request", product: fresh },
        { status: 409 }
      );
    }

    const updated = await prisma.product.findUnique({ where, select: { id: true, inStock: true } });
    return NextResponse.json(
      { message: "Product stock updated successfully", product: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("toggle-stock error:", err);
    if (err?.code && String(err.code).startsWith("P")) {
      return NextResponse.json({ error: err.message || "Database error" }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}
