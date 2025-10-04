"use client";

import { Suspense, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { MoveLeftIcon, PackageOpen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ProductsFilterBar from "@/components/ProductsFilterBar";

function slugify(str = "") {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}
function titleize(slug = "") {
  return String(slug).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ShopContent() {
  const searchParams = useSearchParams();
  const searchParam = (searchParams.get("search") || "").trim();
  const categoryParamRaw = (searchParams.get("category") || "").toLowerCase();
  const sortParam = (searchParams.get("sort") || "").toLowerCase();
  const router = useRouter();

  const products = useSelector((state) => state.product?.list || []);
  const prefersReduce = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    show: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { when: "beforeChildren", staggerChildren: 0.06, delay },
    }),
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.995 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 220, damping: 20 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
  };

  const { filtered, headingLabel, subLabel } = useMemo(() => {
    const catKey = categoryParamRaw || "all";
    const isAll = catKey === "all";

    let list = isAll ? products : products.filter((p) => slugify(p?.category || "") === catKey);

    if (searchParam) {
      const needle = searchParam.toLowerCase();
      list = list.filter((p) => (p?.name || "").toLowerCase().includes(needle));
    }

    // sort (safe if price missing)
    if (sortParam === "name-asc") {
      list = [...list].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    } else if (sortParam === "price-asc") {
      list = [...list].sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
    } else if (sortParam === "price-desc") {
      list = [...list].sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
    }

    const baseHeading = isAll ? "All Products" : titleize(catKey);
    const sub = searchParam ? `“${searchParam}”` : "";

    return { filtered: list, headingLabel: baseHeading, subLabel: sub };
  }, [products, categoryParamRaw, searchParam, sortParam]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/shop");
  };

  return (
    <div className="min-h-[70vh]">
      {/* sticky filter bar at top */}
      <ProductsFilterBar />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Page heading */}
        <motion.div
          className="flex items-center justify-between py-5"
          initial={prefersReduce ? false : "hidden"}
          animate={prefersReduce ? false : "show"}
          variants={containerVariants}
        >
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            {(searchParam || categoryParamRaw) && <MoveLeftIcon size={18} />}
            <span className="text-xl md:text-2xl font-semibold text-slate-800">
              {headingLabel} {subLabel && <span className="text-slate-400 font-normal">&middot; {subLabel}</span>}
            </span>
          </button>

          <div className="text-sm text-slate-500">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 xl:gap-10 mb-28"
          initial={prefersReduce ? false : "hidden"}
          animate={prefersReduce ? false : "show"}
          variants={containerVariants}
        >
          <AnimatePresence initial={false}>
            {filtered.length > 0 ? (
              filtered.map((product) => (
                <motion.div
                  key={product.id}
                  className="col-span-1"
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  whileHover={prefersReduce ? undefined : { y: -4, scale: 1.01 }}
                  whileTap={prefersReduce ? undefined : { scale: 0.995 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="empty"
                className="col-span-full"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 py-16 text-center">
                  <PackageOpen className="mb-3" size={36} />
                  <p className="text-slate-700 font-medium">No products found</p>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting filters or clearing search.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
