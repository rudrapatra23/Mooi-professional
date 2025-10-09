// app/api/store/product/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // needed for formData() with files

// Configure body size limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

/** ========= Helpers ========= */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

async function imagesFromForm(files) {
  // NOTE: For real prod performance, store files on S3/Cloudinary and save URLs.
  const out = [];
  for (const f of files) {
    if (!f || typeof f.arrayBuffer !== "function") continue;
    const mime = f.type || "image/jpeg";
    const buf = Buffer.from(await f.arrayBuffer());
    out.push(`data:${mime};base64,${buf.toString("base64")}`);
  }
  return out;
}

function parseId(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  return s ? s : null; // treat id as string (UUID/cuid) — faster and simpler
}

/** ========= GET ========= */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const productId = parseId(url.searchParams.get("productId"));

    // Single product
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
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
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ product });
    }

    // List (paginated + filters)
    const page = Math.max(1, num(new URL(req.url).searchParams.get("page"), 1));
    const limit = clamp(num(new URL(req.url).searchParams.get("limit"), DEFAULT_LIMIT), 1, MAX_LIMIT);
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const category = new URL(req.url).searchParams.get("category")?.trim();
    const sort = new URL(req.url).searchParams.get("sort") || "-createdAt"; // e.g. "price" or "-price"

    const where = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        category ? { category } : {},
        // if you use soft deletes, exclude deleted by default:
        // { isDeleted: false }
      ],
    };

    let orderBy = { createdAt: "desc" };
    if (sort) {
      const desc = sort.startsWith("-");
      const key = desc ? sort.slice(1) : sort;
      if (["createdAt", "price", "mrp", "stock", "name"].includes(key)) {
        orderBy = { [key]: desc ? "desc" : "asc" };
      }
    }

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          mrp: true,
          category: true,
          inStock: true,
          images: true,
          createdAt: true,
        },
      }),
    ]);

    console.log("LIST_COUNT_STORE", items.length);

    return NextResponse.json({
      total,
      page,
      limit,
      items: items.map((p) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images.slice(0, 1) : p.images,
      })),
    });
  } catch (err) {
    console.error("GET /api/store/product error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** ========= POST ========= */
export async function POST(req) {
  try {
    const form = await req.formData();

    const name = form.get("name")?.toString().trim();
    const description = form.get("description")?.toString().trim() || "";
    const mrp = num(form.get("mrp"));
    const price = num(form.get("price"));
    const category = form.get("category")?.toString().trim() || "";
    const stock = num(form.get("stock"));
    const files = form.getAll("images").filter(Boolean);

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!Number.isFinite(mrp) || !Number.isFinite(price))
      return NextResponse.json({ error: "Prices must be numbers" }, { status: 400 });

    const images = await imagesFromForm(files);
    const product = await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        stock,
        inStock: stock > 0,
        images,
      },
      select: { id: true, name: true },
    });

    console.log("CREATED_PRODUCT_STORE", product.id, product.name);

    return NextResponse.json({ message: "Product added successfully ✅", product }, { status: 201 });
  } catch (err) {
    console.error("POST /api/store/product error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

/** ========= PUT ========= */
export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const productId = parseId(url.searchParams.get("productId"));
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const form = await req.formData();

    const name = form.get("name");
    const description = form.get("description");
    const mrpRaw = form.get("mrp");
    const priceRaw = form.get("price");
    const category = form.get("category");
    const stockRaw = form.get("stock");

    const data = {};
    if (name != null) data.name = String(name);
    if (description != null) data.description = String(description);
    if (mrpRaw != null && Number.isFinite(num(mrpRaw))) data.mrp = num(mrpRaw);
    if (priceRaw != null && Number.isFinite(num(priceRaw))) data.price = num(priceRaw);
    if (category != null) data.category = String(category);
    if (stockRaw != null && Number.isFinite(num(stockRaw))) {
      const stock = num(stockRaw);
      data.stock = stock;
      data.inStock = stock > 0;
    }

    const files = form.getAll("images").filter(Boolean);
    if (files.length > 0) {
      data.images = await imagesFromForm(files); // replace
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
      select: { id: true, name: true, images: true },
    });

    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("PUT /api/store/product error:", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

/** ========= DELETE =========
 * DELETE /api/store/product?productId=ID
 * Optional: ?soft=true -> sets isDeleted = true (requires isDeleted field in Product model)
 */
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const productId = parseId(url.searchParams.get("productId"));
    const soft = url.searchParams.get("soft") === "true";

    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    if (soft) {
      // Soft delete: mark as deleted (safer until you decide schema migrations)
      // Make sure you have `isDeleted Boolean @default(false)` in Product model
      const updated = await prisma.product.update({
        where: { id: productId },
        data: { isDeleted: true },
        select: { id: true, name: true },
      });
      return NextResponse.json({ message: "Product soft-deleted", product: updated });
    }

    // Hard delete: delete related order items first, then delete product
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    return NextResponse.json({ message: "Product and related order items deleted" });
  } catch (err) {
    console.error("DELETE /api/store/product error:", err);

    // Foreign key violation (still exists if something else referenced it)
    if (err?.code === "P2003") {
      return NextResponse.json(
        { error: "Foreign key constraint: related records exist. Consider using soft delete or remove related records first." },
        { status: 400 }
      );
    }

    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
