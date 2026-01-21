'use client'
import { Suspense, lazy } from "react"
import Hero from "@/components/Hero";

// Lazy load below-the-fold components for faster initial load
const ShopByCategory = lazy(() => import("@/components/ShopByCategory"));
const LatestProducts = lazy(() => import("@/components/LatestProducts"));
const BestSelling = lazy(() => import("@/components/BestSelling"));
const OurSpecs = lazy(() => import("@/components/OurSpec"));
const Reels = lazy(() => import("@/components/Reels"));
const Newsletter = lazy(() => import("@/components/Newsletter"));

// Simple loading skeleton
const SectionLoader = () => (
  <div className="h-96 bg-gray-50 animate-pulse" />
);

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Hero - load immediately */}
      <Hero />

      {/* Shop by Category */}
      <Suspense fallback={<SectionLoader />}>
        <ShopByCategory />
      </Suspense>

      {/* Latest Products */}
      <Suspense fallback={<SectionLoader />}>
        <LatestProducts />
      </Suspense>

      {/* Best Selling */}
      <Suspense fallback={<SectionLoader />}>
        <BestSelling />
      </Suspense>

      {/* Our Specs & Reels */}
      <Suspense fallback={<SectionLoader />}>
        <OurSpecs />
        <Reels />
      </Suspense>

      {/* Newsletter */}
      <Suspense fallback={<SectionLoader />}>
        <Newsletter />
      </Suspense>
    </div>
  );
}
