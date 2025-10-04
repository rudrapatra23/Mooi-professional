// app/api/store/product/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const STORE_ID = process.env.STORE_ID; // string id

// helper: convert files -> base64 image strings
async function imagesFromForm(files) {
  const images = [];
  for (const file of files) {
    if (!file || typeof file.arrayBuffer !== "function") continue;
    const mime = file.type || "image/jpeg";
    const buf = Buffer.from(await file.arrayBuffer());
    images.push(`data:${mime};base64,${buf.toString("base64")}`);
  }
  return images;
}

// helper: parse productId param and return typed value
function parseProductIdParam(raw) {
  if (raw === null || raw === undefined) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;
  // pure numeric (e.g. "123")
  if (/^\d+$/.test(trimmed)) return { by: "number", value: Number(trimmed) };
  // otherwise treat as string id (UUID or custom)
  return { by: "string", value: trimmed };
}

// helper: build prisma where clause from parsed id
function whereFromParsed(parsed) {
  if (!parsed) return null;
  // This will try to use the same field name `id`. If your Product model uses a different unique
  // identifier (like `slug` or `uid`), adjust this function accordingly.
  return parsed.by === "number" ? { id: parsed.value } : { id: parsed.value };
}

/* -------------------------------
   GET: list all products for store or single product by productId
   ------------------------------- */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const rawId = url.searchParams.get("productId");

    if (rawId !== null) {
      // single product
      const parsed = parseProductIdParam(rawId);
      if (!parsed) {
        return NextResponse.json({ error: "productId query parameter required" }, { status: 400 });
      }

      const where = whereFromParsed(parsed);
      let product;
      try {
        product = await prisma.product.findUnique({
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
        });
      } catch (err) {
        // likely a type mismatch between provided id and DB column type
        console.error("GET product findUnique error (type mismatch?):", err);
        return NextResponse.json(
          {
            error:
              "Error reading product. Possible id type mismatch (string vs number). Check the productId you're passing and your schema.",
          },
          { status: 400 }
        );
      }

      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

      // ownership check (string compare for safety)
      if (String(product.storeId) !== String(STORE_ID)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ product });
    }

    // list all products for this single store
    const products = await prisma.product.findMany({
      where: { storeId: STORE_ID },
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
  } catch (err) {
    console.error("GET /api/store/product error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

/* -------------------------------
   PUT: update product (supports multipart/form-data for images)
   Usage: PUT /api/store/product?productId=... with form fields
   - If images are included, they replace existing images.
   - If no images are included, existing images are preserved.
   ------------------------------- */
export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const rawId = url.searchParams.get("productId");
    const parsed = parseProductIdParam(rawId);

    if (!parsed) return NextResponse.json({ error: "productId query parameter required" }, { status: 400 });

    const where = whereFromParsed(parsed);

    // verify product exists and belongs to store
    let existing;
    try {
      existing = await prisma.product.findUnique({ where });
    } catch (err) {
      console.error("PUT product findUnique error (type mismatch?):", err);
      return NextResponse.json(
        { error: "Invalid productId or id type mismatch. Check the id and your schema." },
        { status: 400 }
      );
    }

    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (String(existing.storeId) !== String(STORE_ID)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const form = await request.formData();

    const name = form.get("name")?.toString();
    const description = form.get("description")?.toString();
    const mrpRaw = form.get("mrp");
    const priceRaw = form.get("price");
    const category = form.get("category")?.toString();
    const stockRaw = form.get("stock");

    const mrp = mrpRaw !== null ? Number(mrpRaw) : undefined;
    const price = priceRaw !== null ? Number(priceRaw) : undefined;
    const stock = stockRaw !== null ? Number(stockRaw) : undefined;

    // images handling: if new files present -> replace; else keep existing images
    const files = form.getAll("images");
    let imagesToSet = undefined;
    const validFiles = files.filter((f) => f && typeof f.arrayBuffer === "function");
    if (validFiles.length > 0) {
      imagesToSet = await imagesFromForm(validFiles);
    }

    // build update data only with provided values
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (mrp !== undefined && !Number.isNaN(mrp)) data.mrp = mrp;
    if (price !== undefined && !Number.isNaN(price)) data.price = price;
    if (category !== undefined) data.category = category;
    if (stock !== undefined && !Number.isNaN(stock)) {
      data.stock = stock;
      data.inStock = stock > 0;
    }
    if (imagesToSet !== undefined) data.images = imagesToSet;

    const updated = await prisma.product.update({
      where,
      data,
      select: { id: true, name: true, storeId: true, images: true },
    });

    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("PUT /api/store/product error:", err);
    if (err?.code === "P2003") {
      return NextResponse.json({ error: "Foreign key constraint failed. Verify store config." }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

/* -------------------------------
   DELETE: delete a product by productId (numeric or string)
   ------------------------------- */
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const rawId = url.searchParams.get("productId");
    const parsed = parseProductIdParam(rawId);

    if (!parsed) return NextResponse.json({ error: "productId query parameter required" }, { status: 400 });

    const where = whereFromParsed(parsed);

    // ensure ownership
    let existing;
    try {
      existing = await prisma.product.findUnique({ where });
    } catch (err) {
      console.error("DELETE product findUnique error (type mismatch?):", err);
      return NextResponse.json(
        { error: "Invalid productId or id type mismatch. Check the id and your schema." },
        { status: 400 }
      );
    }

    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (String(existing.storeId) !== String(STORE_ID)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.product.delete({ where });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /api/store/product error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}
