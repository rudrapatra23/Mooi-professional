// app/api/product/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function parseNumishId(id) {
  // if all digits -> numeric id
  if (typeof id !== "string") return id;
  return /^\d+$/.test(id) ? Number(id) : id;
}

async function toDataUrl(file) {
  // file is a File from request.formData()
  // convert to base64 data URL for easy storage/testing
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type || "application/octet-stream";
  const b64 = buffer.toString("base64");
  return `data:${mime};base64,${b64}`;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const productIdRaw = url.searchParams.get("productId");
    if (!productIdRaw) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }
    const productId = parseNumishId(productIdRaw);

    const product = await prisma.product.findUnique({
      where: typeof productId === "number" ? { id: productId } : { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        mrp: true,
        price: true,
        category: true,
        stock: true,
        inStock: true,
        images: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // normalize numeric fields to JS numbers/strings the client expects
    return NextResponse.json({ product });
  } catch (err) {
    console.error("GET /api/product error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const productIdRaw = url.searchParams.get("productId");
    if (!productIdRaw) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }
    const productId = parseNumishId(productIdRaw);

    // parse multipart/form-data via Request.formData()
    const form = await request.formData();

    // read text fields (fall back to undefined if not present)
    const name = form.get("name") ?? undefined;
    const description = form.get("description") ?? undefined;
    const mrpRaw = form.get("mrp");
    const priceRaw = form.get("price");
    const category = form.get("category") ?? undefined;
    const stockRaw = form.get("stock");

    const mrp = mrpRaw !== null && mrpRaw !== undefined && String(mrpRaw).length ? Number(mrpRaw) : undefined;
    const price = priceRaw !== null && priceRaw !== undefined && String(priceRaw).length ? Number(priceRaw) : undefined;
    const stock = stockRaw !== null && stockRaw !== undefined && String(stockRaw).length ? Number(stockRaw) : undefined;

    // collect images: form.getAll('images') returns an array of File or scalars
    const imageFiles = form.getAll("images").filter(Boolean);
    let imagesToSave = [];

    if (imageFiles.length) {
      // convert each File to data URL
      const arr = [];
      for (const file of imageFiles) {
        // If the client didn't send File objects (some browsers), skip gracefully
        if (file && typeof file.arrayBuffer === "function") {
          arr.push(await toDataUrl(file));
        }
      }
      imagesToSave = arr;
    }

    // fetch existing record to decide how to update images if needed
    const existing = await prisma.product.findUnique({
      where: typeof productId === "number" ? { id: productId } : { id: productId },
      select: { images: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updatedData = {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(mrp !== undefined ? { mrp } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(stock !== undefined ? { stock } : {}),
      // if client uploaded new images, replace; otherwise keep existing
      ...(imagesToSave.length ? { images: imagesToSave } : {}),
      // update inStock derived from stock if you want, else leave as-is
      ...(stock !== undefined ? { inStock: stock > 0 } : {}),
    };

    const updated = await prisma.product.update({
      where: typeof productId === "number" ? { id: productId } : { id: productId },
      data: updatedData,
    });

    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("PUT /api/product error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const productIdRaw = url.searchParams.get("productId");
    if (!productIdRaw) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }
    const productId = parseNumishId(productIdRaw);

    // ensure exists (optional)
    const existing = await prisma.product.findUnique({
      where: typeof productId === "number" ? { id: productId } : { id: productId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: typeof productId === "number" ? { id: productId } : { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/product error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
