// app/(public)/shop/page.jsx
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Shop({ searchParams }) {
  const category = searchParams?.category || null; // "hair-care" | "skin-care" | null

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const api = `${base}/api/products${qs}`;

  const res = await fetch(api, { cache: "no-store" });
  const { products = [] } = await res.json();

  const title =
    category === "hair-care"
      ? "Hair Care Products"
      : category === "skin-care"
      ? "Skin Care Products"
      : "All Products";

  return (
    <section className="max-w-7xl mx-auto px-6 my-12">
      <h1 className="text-3xl font-semibold text-slate-800 mb-8">{title}</h1>

      {products.length === 0 ? (
        <p className="text-slate-500">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
