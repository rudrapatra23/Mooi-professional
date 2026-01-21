'use client';
import { useEffect, useState, useRef, memo, useCallback } from "react";
import ProductCard from "./ProductCard";
import Title from "./Title";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ProductSkeleton = memo(() => (
  <div className="flex-shrink-0 w-[220px] sm:w-[240px] md:w-[200px] animate-pulse">
    <div className="aspect-square bg-gray-100 mb-3" />
    <div className="h-4 bg-gray-200 mb-2 w-3/4" />
    <div className="h-3 bg-gray-100 w-1/2" />
  </div>
));

ProductSkeleton.displayName = 'ProductSkeleton';

export default function LatestProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?limit=12', { signal: controller.signal });
        const data = await res.json();
        setProducts(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        if (err.name !== 'AbortError') setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
    return () => controller.abort();
  }, []);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [products, checkScroll]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  const totalCount = products.length;

  return (
    <div className="px-6 my-20 md:my-28 max-w-6xl mx-auto bg-white">
      <Title title="Latest Products" description={loading ? "Loading..." : `Showing ${totalCount} products`} href="/shop" />

      <div className="relative mt-10 group/scroll">
        {canScrollLeft && (
          <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all opacity-0 group-hover/scroll:opacity-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && (
          <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all opacity-0 group-hover/scroll:opacity-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div ref={scrollRef} className="flex gap-6 xl:gap-10 overflow-x-auto scroll-smooth pb-4 no-scrollbar">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <div key={product?.id ?? index} className="flex-shrink-0 w-[220px] sm:w-[240px] md:w-[200px]">
                <ProductCard product={product} />
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No products available</p>
          )}
        </div>
      </div>
    </div>
  );
}
