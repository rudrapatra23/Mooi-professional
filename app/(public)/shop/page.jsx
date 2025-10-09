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
    <div className="min-h-[70vh] mx-6">
      <ProductsFilterBar />
      <div className="max-w-7xl mx-auto">
        <h1
          onClick={handleBack}
          className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer"
        >
          {(q || category) && <MoveLeftIcon size={20} />}
          <span className="text-slate-700 font-medium">{headingLabel}</span>
          {subLabel && <span className="text-slate-400 text-lg"> &middot; {subLabel}</span>}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-12 mx-auto mb-32">
          {Array.isArray(products) && products.length > 0 ? (
            products.map((product) => {
              const thumb = Array.isArray(product.images) ? product.images[0] : null;
              return (
                <div key={product.id} className="col-span-1">
                  <ProductCard product={{ ...product, images: thumb ? [thumb] : [] }} />
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-slate-500">No products found.</div>
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
