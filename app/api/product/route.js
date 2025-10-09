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
