'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import Title from "./Title";

export default function ShopByCategory() {
  const [category, setCategory] = useState("hair-care"); // Default category
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products?category=${category}&limit=20`);
        if (!cancelled) setProducts(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        console.error("Failed to load products:", err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProducts();
    return () => { cancelled = true; };
  }, [category]);

  const categories = [
    { slug: "hair-care", label: "Hair Care" },
    { slug: "skin-care", label: "Skin Care" },
  ];

  return (
    <div className="px-6 my-30 max-w-6xl mx-auto">
      {/* Section Heading */}
      <Title
        title="Shop by Category"
        description={`Explore our ${category.replace("-", " ")} collection`}
        href="/shop"
      />

      {/* Category Toggle Buttons */}
      <div className="flex gap-3 mt-6 mb-6 justify-center flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setCategory(cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat.slug
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Horizontal scroller */}
      {loading ? (
        <div className="text-slate-500 text-center py-6">Loading products...</div>
      ) : products.length > 0 ? (
        <div
          className="mt-4 -mx-6 px-6 overflow-x-auto scroll-snap-x snap-mandatory flex gap-4 py-3"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {products.slice(0, 12).map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[220px] sm:w-[240px] md:w-[260px] scroll-snap-align-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-slate-500 text-center py-6">
          No products found for this category.
        </div>
      )}
    </div>
  );
}
