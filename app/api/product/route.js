// app/api/product/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
async function imagesFromForm(files) {
  const out = [];
  for (const f of files) {
    if (!f || typeof f.arrayBuffer !== "function") continue;
    const mime = f.type || "image/jpeg";
    const buf = Buffer.from(await f.arrayBuffer());
    out.push(`data:${mime};base64,${buf.toString("base64")}`);
  }
  return out;
}
function parseImagesArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (typeof arr === "string") {
    try { return JSON.parse(arr); } catch { return [arr]; }
  }
  return [];
}

function parseProductId(url) {
  try {
    return new URL(url).searchParams.get("productId") || null;
  } catch {
    return null;
  }
}

/* ------------------ GET ------------------ */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id:true,name:true,description:true,mrp:true,price:true,category:true,stock:true,inStock:true,images:true,createdAt:true,updatedAt:true }
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    console.error("GET /api/product error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ------------------ POST (create) ------------------ */
/* (You already had this; kept for completeness) */
export async function POST(req) {
  try {
    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    let name, description, mrp, price, category, stock, images = [];

    if (contentType.includes("application/json")) {
      const body = await req.json();
      name = (body.name || "").toString().trim();
      description = (body.description || "").toString();
      mrp = Number(body.mrp);
      price = Number(body.price);
      category = (body.category || "").toString();
      stock = Number.isFinite(Number(body.stock)) ? Number(body.stock) : 0;
      images = parseImagesArray(body.images);
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      name = form.get("name")?.toString().trim();
      description = form.get("description")?.toString() || "";
      mrp = num(form.get("mrp"));
      price = num(form.get("price"));
      category = form.get("category")?.toString() || "";
      stock = num(form.get("stock"));
      const files = form.getAll("images").filter(Boolean);
      if (files.length > 0) images = await imagesFromForm(files);
      else images = parseImagesArray(form.get("images"));
    } else {
      return NextResponse.json({ error: "Unsupported Content-Type. Send application/json or multipart/form-data" }, { status: 415 });
    }

    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    if (!Number.isFinite(mrp) || !Number.isFinite(price)) {
      return NextResponse.json({ error: "mrp and price must be numbers" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: { name, description, mrp, price, category, stock, inStock: (stock||0) > 0, images },
      select: { id:true, name:true, price:true, mrp:true, images:true, createdAt:true }
    });

    return NextResponse.json({ message: "Product created", product }, { status: 201 });
  } catch (err) {
    console.error("POST /api/product error:", err);
    return NextResponse.json({ error: err?.message || "Failed to create product" }, { status: 500 });
  }
}

/* ------------------ PUT (update) ------------------ */
export async function PUT(req) {
  try {
    const productId = parseProductId(req.url);
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    let payload = {};
    if (contentType.includes("application/json")) {
      const json = await req.json().catch(() => ({}));
      payload.name = json.name;
      payload.description = json.description;
      payload.mrp = typeof json.mrp !== "undefined" ? Number(json.mrp) : undefined;
      payload.price = typeof json.price !== "undefined" ? Number(json.price) : undefined;
      payload.category = json.category;
      payload.stock = typeof json.stock !== "undefined" ? Number(json.stock) : undefined;
      payload.images = Array.isArray(json.images) ? json.images : parseImagesArray(json.images);
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      payload.name = form.get("name")?.toString();
      payload.description = form.get("description")?.toString();
      payload.mrp = typeof form.get("mrp") !== "undefined" ? num(form.get("mrp")) : undefined;
      payload.price = typeof form.get("price") !== "undefined" ? num(form.get("price")) : undefined;
      payload.category = form.get("category")?.toString();
      payload.stock = typeof form.get("stock") !== "undefined" ? num(form.get("stock")) : undefined;

      const files = form.getAll("images").filter(Boolean);
      if (files.length > 0) {
        payload.images = await imagesFromForm(files);
      } else {
        payload.images = parseImagesArray(form.get("images"));
      }
    } else {
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
    }

    // build update object with only provided fields
    const updateData = {};
    if (typeof payload.name !== "undefined") updateData.name = payload.name;
    if (typeof payload.description !== "undefined") updateData.description = payload.description;
    if (typeof payload.mrp !== "undefined") updateData.mrp = payload.mrp;
    if (typeof payload.price !== "undefined") updateData.price = payload.price;
    if (typeof payload.category !== "undefined") updateData.category = payload.category;
    if (typeof payload.stock !== "undefined") {
      updateData.stock = payload.stock;
      updateData.inStock = (payload.stock || 0) > 0;
    }
    if (typeof payload.images !== "undefined") updateData.images = payload.images;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return NextResponse.json({ message: "Product updated", updated });
  } catch (err) {
    console.error("PUT /api/product error:", err);
    if (err.code === "P2025") return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ error: err?.message || "Failed to update product" }, { status: 500 });
  }
}

/* ------------------ DELETE ------------------ */
export async function DELETE(req) {
  try {
    const productId = parseProductId(req.url);
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ message: "Product deleted", success: true });
  } catch (err) {
    console.error("DELETE /api/product error:", err);
    if (err.code === "P2025") return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ error: err?.message || "Failed to delete product" }, { status: 500 });
  }
}
