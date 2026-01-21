// app/(public)/shop/[username]/page.jsx
import ProductGrid from "./ProductGrid";

export const dynamic = "force-dynamic";

export default async function Shop({ searchParams }) {
  const category = searchParams?.category || null;

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const api = `${base}/api/products${qs}`;

  const res = await fetch(api, { cache: "no-store" });
  const { products = [], items = [] } = await res.json();

  // API returns 'items' but we also handle 'products' for compatibility
  const productList = products.length > 0 ? products : items;

  const title =
    category === "hair-care"
      ? "Hair Care Products"
      : category === "skin-care"
        ? "Skin Care Products"
        : "All Products";

  return (
    <section className="max-w-7xl mx-auto px-6 my-12">
      <h1 className="text-3xl font-semibold text-slate-800 mb-8">{title}</h1>
      <ProductGrid products={productList} />
    </section>
  );
}
