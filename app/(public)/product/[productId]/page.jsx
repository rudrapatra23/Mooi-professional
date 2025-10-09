// app/.../product/page.jsx  — paste over your product detail file
'use client'

import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

// Optional: import fetchProducts thunk if you still want to auto-fetch full list
// import { fetchProducts } from "@/store/productSlice"; // adjust path if you use this

export default function Product() {
  const { productId } = useParams();
  const dispatch = useDispatch();

  // global list (may be empty)
  const products = useSelector((state) => state.product?.list ?? []);

  // only used when global list empty: fetch single product
  const [singleProduct, setSingleProduct] = useState(null);
  const singleFetchRef = useRef(false);

  // If products empty, fetch single product once
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) return; // we have list -> no fetch

    if (singleFetchRef.current) return; // already fetched once
    singleFetchRef.current = true;

    // fetch single product from your existing backend route
    (async () => {
      try {
        const res = await fetch(`/api/product?productId=${encodeURIComponent(productId)}`);
        if (!res.ok) {
          // product not found or error -> leave singleProduct as null
          return;
        }
        const data = await res.json();
        // backend returns { product: {...} }
        if (data?.product) setSingleProduct(data.product);
      } catch (err) {
        // network error — keep singleProduct null
        // optional: console.error('fetch single product error', err);
      }
    })();
    // only run on productId change (and initial mount)
  }, [productId, products.length]);

  // derive product either from global list or from singleProduct fallback
  const product = useMemo(() => {
    if (Array.isArray(products) && products.length > 0) {
      return products.find((p) => String(p?.id) === String(productId)) ?? null;
    }
    return singleProduct ?? null;
  }, [products, productId, singleProduct]);

  // scroll on productId change
  useEffect(() => {
    try { if (typeof window !== 'undefined') window.scrollTo(0, 0); } catch (e) {}
  }, [productId]);

  return (
    <div className="mx-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-gray-600 text-sm mt-8 mb-5">
          Home / Products / {product?.category ?? "Loading..."}
        </div>

        {product ? (
          <div>
            <ProductDetails product={product} />
            <ProductDescription product={product} />
          </div>
        ) : Array.isArray(products) && products.length === 0 && singleProduct === null ? (
          <div className="py-10 text-center">Loading product...</div>
        ) : (
          <div className="py-10 text-center">Product not found.</div>
        )}
      </div>
    </div>
  );
}
