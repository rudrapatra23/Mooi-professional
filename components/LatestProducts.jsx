'use client';
import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "./ProductCard";
import Title from "./Title";

export default function LatestProducts() {
  const displayQuantity = 8;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await axios.get("/api/products?limit=20");
        setProducts(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        console.error("Failed to load latest products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-slate-500 max-w-6xl mx-auto">
        Loading latest products...
      </div>
    );
  }

  const safeProducts = Array.isArray(products) ? products : [];
  const totalCount = safeProducts.length;
  const visibleCount =
    totalCount < displayQuantity ? totalCount : displayQuantity;

  const latest = safeProducts.slice(0, displayQuantity);

  return (
    <div className="px-6 my-30 max-w-6xl mx-auto">
      {/* Section Title */}
      <Title
        title="Latest Products"
        description={`Showing ${visibleCount} of ${totalCount} products`}
        href="/shop"
      />

      {/* 🔥 Horizontal Scroll Area */}
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
        {latest.length > 0 ? (
          latest.map((product, index) => (
            <div
              key={product?.id ?? index}
              className="flex-shrink-0 w-[220px] sm:w-[240px] md:w-[260px]"
            >
              <ProductCard product={product} />
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-sm">No products available</p>
        )}
      </div>
    </div>
  );
}
