'use client';
import { useEffect, useState } from "react";
import Title from "./Title";
import ProductCard from "./ProductCard";
import axios from "axios";

export default function BestSelling({ limit = 8 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/products/best-sellers?limit=${limit}`);
        if (!cancelled) {
          setProducts(Array.isArray(data?.products) ? data.products : []);
        }
      } catch (err) {
        console.error("Failed to load best sellers:", err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  const totalCount = products.length;
  const visibleCount = Math.min(totalCount, limit);

  return (
    <div className="px-6 my-30 max-w-6xl mx-auto">
      <Title
        title="Best Selling"
        description={loading ? "Loading..." : `Showing ${visibleCount} of ${totalCount} products`}
        href="/shop"
      />

     <div
  className="
    mt-10
    flex
    gap-6
    xl:gap-10
    overflow-x-auto
    scrollbar-thin
    scrollbar-thumb-emerald-500
    scrollbar-track-gray-200
    pb-4
  "
>
  {loading ? (
    // skeleton cards in horizontal layout
    Array.from({ length: limit }).map((_, i) => (
      <div
        key={i}
        className="flex-shrink-0 w-[220px] sm:w-[240px] md:w-[200px] animate-pulse"
      >
        <div className="bg-slate-200 aspect-square rounded mb-3" />
        <div className="bg-slate-200 h-4 rounded mb-2" />
        <div className="bg-slate-200 h-3 rounded w-2/3" />
      </div>
    ))
  ) : products.length > 0 ? (
    products.map((product, index) => (
      <div
        key={product?.id ?? index}
        className="flex-shrink-0 w-[220px] sm:w-[240px] md:w-[200px]"
      >
        <ProductCard product={product} />
      </div>
    ))
  ) : (
    <p className="text-slate-500 text-sm">No best sellers yet — check latest products.</p>
  )}
</div>

    </div>
  );
}
