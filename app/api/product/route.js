// inside app/api/product/route.js (replace the GET implementation)
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

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
  } catch (err) {
    console.error("GET /api/product error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
