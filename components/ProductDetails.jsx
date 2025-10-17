"use client";

import {
  StarIcon,
  TagIcon,
  EarthIcon,
  CreditCardIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/lib/features/cart/cartSlice";

const ProductDetails = ({ product }) => {
  if (!product) return null;

  const productId = product.id;
  const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  const cart = useSelector((state) => state.cart?.cartItems ?? {});
  const dispatch = useDispatch();
  const router = useRouter();

  const [mainImage, setMainImage] = useState(
    Array.isArray(product.images) && product.images.length ? product.images[0] : ""
  );

  // Ratings state
  const [ratingsArray, setRatingsArray] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Fetch ratings from backend (singular route: /api/rating/:productId)
  useEffect(() => {
    let cancelled = false;

    async function fetchRatings() {
      if (!product?.id) return;
      setLoadingRatings(true);
      try {
        const res = await fetch(`/api/rating/${product.id}`);
        if (!res.ok) return;
        const body = await res.json();
        const arr = Array.isArray(body)
          ? body
          : Array.isArray(body?.rows)
          ? body.rows
          : Array.isArray(body?.ratings)
          ? body.ratings
          : [];
        if (cancelled) return;
        setRatingsArray(arr);

        if (arr.length > 0) {
          const avg = arr.reduce((acc, r) => acc + (r.rating || 0), 0) / arr.length;
          setAverageRating(avg);
        } else {
          setAverageRating(0);
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
        if (!cancelled) {
          setRatingsArray([]);
          setAverageRating(0);
        }
      } finally {
        if (!cancelled) setLoadingRatings(false);
      }
    }

    if (product?.id) fetchRatings();

    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const addToCartHandler = () => {
    if (!product.inStock) return;
    dispatch(addToCart({ productId }));
  };

  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const getStockLabel = (p) => {
    if (!p?.inStock) return { text: "Currently Out of Stock", tone: "red" };
    if (typeof p?.stock === "number") {
      if (p.stock === 0) return { text: "Currently Out of Stock", tone: "red" };
      if (p.stock < 5) return { text: `Hurry, only ${p.stock} left!`, tone: "orange" };
    }
    return { text: "In Stock", tone: "green" };
  };
  const stockLabel = getStockLabel(product);

  const roundedRating = Math.round(averageRating);

  return (
    <div className="flex max-lg:flex-col gap-12">
      {/* ---------- IMAGE SECTION ---------- */}
      <div className="flex max-sm:flex-col-reverse gap-3">
        <div className="flex sm:flex-col gap-3">
          {Array.isArray(product.images) && product.images.length ? (
            product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setMainImage(image)}
                className="bg-slate-100 flex items-center justify-center w-16 h-16 rounded-lg cursor-pointer hover:ring-2 hover:ring-yellow-400 transition-all"
                type="button"
              >
                <img
                  src={image}
                  alt={`thumb-${index}`}
                  className="max-w-full max-h-full object-contain block"
                />
              </button>
            ))
          ) : (
            <div className="text-slate-400 text-sm">No images</div>
          )}
        </div>

        <div className="flex justify-center items-center">
          <div className="w-[400px] h-[400px] bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-md">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain block"
              />
            ) : (
              <div className="text-slate-400 text-sm">No image available</div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- PRODUCT INFO SECTION ---------- */}
      <div className="flex-1">
        <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>

        {/* ---------- RATINGS SECTION ---------- */}
        <div className="flex items-center mt-3">
          {Array(5)
            .fill("")
            .map((_, i) => {
              const filled = roundedRating >= i + 1;
              return (
                <StarIcon
                  key={i}
                  size={18}
                  fill={filled ? "#FACC15" : "none"}
                  stroke={filled ? "#FACC15" : "#9CA3AF"}
                  className="mr-1"
                />
              );
            })}
          <span className="ml-3 text-sm text-slate-600">
            {averageRating.toFixed(1)} / 5 ({ratingsArray.length}{" "}
            {ratingsArray.length === 1 ? "Review" : "Reviews"})
          </span>
        </div>

        {/* ---------- PRICE + STOCK + ADD TO CART ---------- */}
        <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
          <p>{fmt.format(product.price)}</p>
          {typeof product.mrp === "number" && product.mrp > product.price && (
            <p className="text-xl text-slate-500 line-through">
              {fmt.format(product.mrp)}
            </p>
          )}
        </div>

        <div className="mt-2">
          <p
            className={`font-medium ${
              stockLabel.tone === "green"
                ? "text-green-600"
                : stockLabel.tone === "orange"
                ? "text-orange-500"
                : "text-red-600"
            }`}
          >
            {stockLabel.text}
          </p>
        </div>

        {typeof product.mrp === "number" && product.mrp > product.price && (
          <div className="flex items-center gap-2 text-slate-500 mt-3">
            <TagIcon size={14} />
            <p>
              Save{" "}
              {(((product.mrp - product.price) / product.mrp) * 100).toFixed(0)}%
              right now
            </p>
          </div>
        )}

        <div className="flex items-end gap-5 mt-10">
          {cart[productId] && (
            <div className="flex flex-col gap-3">
              <p className="text-lg text-slate-800 font-semibold">Quantity</p>
              <Counter productId={productId} />
            </div>
          )}

          <button
            onClick={() =>
              !cart[productId] ? addToCartHandler() : router.push("/cart")
            }
            disabled={!product.inStock}
            className={`px-10 py-3 text-sm font-medium rounded transition ${
              product.inStock
                ? "bg-slate-800 text-white hover:bg-slate-900 active:scale-95"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
            type="button"
          >
            {!product.inStock
              ? "Out of Stock"
              : !cart[productId]
              ? "Add to Cart"
              : "View Cart"}
          </button>
        </div>

        <hr className="border-gray-300 my-5" />

        {/* ---------- DELIVERY + PAYMENT INFO ---------- */}
        <div className="flex flex-col gap-4 text-slate-500">
          <DeliveryByText />
          <p className="flex gap-3 items-center">
            <CreditCardIcon className="text-slate-400" /> 100% Secured Payment
          </p>
        </div>
      </div>
    </div>
  );
};

/* ---------- Dynamic Delivery Text ---------- */
function DeliveryByText() {
  const now = new Date();
  const eta = new Date(now);
  eta.setDate(now.getDate() + 7);

  const formatted = eta.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <p className="flex gap-3 items-center text-slate-600">
      <EarthIcon className="text-slate-400" />
      <span>
        Delivery within 7 days —{" "}
        <span className="font-medium text-slate-800">by {formatted}</span>
      </span>
    </p>
  );
}

export default ProductDetails;
