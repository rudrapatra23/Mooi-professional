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
    <div className="sticky top-0 z-30 bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 text-black" size={20} />
            <input
              type="text"
              placeholder="SEARCH PRODUCTS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border-b border-gray-300 focus:border-black outline-none transition-all placeholder:text-gray-400 text-sm uppercase tracking-wider bg-transparent rounded-none"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-black hidden sm:block">Filter By:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-none whitespace-nowrap transition-all border ${currentCategory === category.slug
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black"
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