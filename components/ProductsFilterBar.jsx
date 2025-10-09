"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";

const categories = [
  { slug: "", label: "All Products" },
  { slug: "hair-care", label: "Hair Care" },
  { slug: "skin-care", label: "Skin Care" },
];

export default function ProductsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const currentCategory = searchParams.get("category") || "";
  const currentQ = searchParams.get("q") || "";

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== currentQ) {
      const params = new URLSearchParams();
      if (currentCategory) params.set("category", currentCategory);
      if (debouncedSearch) params.set("q", debouncedSearch);
      
      const newUrl = params.toString() ? `/shop?${params.toString()}` : "/shop";
      router.push(newUrl);
    }
  }, [debouncedSearch, currentCategory, currentQ, router]);

  // Initialize search from URL
  useEffect(() => {
    setSearch(currentQ);
  }, [currentQ]);

  const handleCategoryChange = useCallback((categorySlug) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (currentQ) params.set("q", currentQ);
    
    const newUrl = params.toString() ? `/shop?${params.toString()}` : "/shop";
    router.push(newUrl);
  }, [currentQ, router]);

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="text-slate-500" size={18} />
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    currentCategory === category.slug
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}