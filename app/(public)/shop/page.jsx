"use client";

import { Suspense, useMemo, useEffect, useState, useCallback } from "react";
import ProductCard from "@/components/ProductCard";
import { MoveLeftIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductsFilterBar from "@/components/ProductsFilterBar";
import axios from "axios";

function titleize(slug = "") {
  return String(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ShopContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    const source = axios.CancelToken.source();
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (q) params.set("q", q);
      params.set("page", "1");
      params.set("limit", "20");

      const { data } = await axios.get(`/api/products?${params.toString()}`, {
        cancelToken: source.token,
        headers: { "x-no-cache": Date.now().toString() },
      });

      setProducts(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(err?.response?.data?.error || err.message || "Failed to load");
      setProducts([]);
    } finally {
      setLoading(false);
    }
    return () => source.cancel("Route/params changed");
  }, [category, q]);

  useEffect(() => {
    const cleanup = fetchProducts();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [fetchProducts]);

  const { headingLabel, subLabel } = useMemo(() => {
    const isAll = !category;
    const baseHeading = isAll ? "All Products" : titleize(category);
    const sub = q ? `"${q}"` : "";
    return { headingLabel: baseHeading, subLabel: sub };
  }, [category, q]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/shop");
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] mx-6">
        <ProductsFilterBar />
        <div className="max-w-7xl mx-auto">
          <div className="text-2xl text-slate-500 my-6 flex items-center gap-2">
            <span className="text-slate-700 font-medium">Loading...</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-12 mx-auto mb-32">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="col-span-1 animate-pulse">
                <div className="bg-slate-200 aspect-square rounded-lg mb-3"></div>
                <div className="bg-slate-200 h-4 rounded mb-2"></div>
                <div className="bg-slate-200 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] mx-6">
        <ProductsFilterBar />
        <div className="max-w-7xl mx-auto">
          <div className="text-2xl text-red-500 my-6">
            Error loading products: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-white text-black">
      {/* Hero / Header Section */}
      <div className="bg-gray-50 border-b border-gray-100 py-16 md:py-24 px-4 sm:px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-serif font-black uppercase tracking-tighter mb-4">
          {headingLabel || "Shop All"}
        </h1>
        <p className="max-w-xl mx-auto text-xs md:text-sm text-gray-500 uppercase tracking-widest leading-relaxed">
          {subLabel ? (
            <span>Search Results for {subLabel}</span>
          ) : (
            "Explore our professional range of premium beauty essentials designed for excellence."
          )}
        </p>
      </div>

      <ProductsFilterBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 cursor-pointer hover:text-black transition-colors w-fit" onClick={handleBack}>
          {(q || category) && <MoveLeftIcon size={14} />}
          {(q || category) && <span>Back to All Products</span>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
          {Array.isArray(products) && products.length > 0 ? (
            products.map((product) => {
              const thumb = Array.isArray(product.images) ? product.images[0] : null;
              return (
                <div key={product.id} className="col-span-1 group">
                  <ProductCard product={{ ...product, images: thumb ? [thumb] : [] }} />
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-xl font-serif text-gray-400">No products found matching your criteria.</p>
              <button onClick={() => router.push("/shop")} className="mt-4 text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600">
                View All Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="p-6">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
