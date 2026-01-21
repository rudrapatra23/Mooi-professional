"use client";

import {
  StarIcon,
  TagIcon,
  EarthIcon,
  CreditCardIcon,
  Heart
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/lib/features/cart/cartSlice";
import { useAuth } from "@clerk/nextjs";
import { toggleWishlist } from "@/lib/features/wishlist/wishlistSlice";

const ProductDetails = ({ product }) => {
  if (!product) return null;

  const productId = product.id;
  const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  const cart = useSelector((state) => state.cart?.cartItems ?? {});
  const wishlistItems = useSelector((state) => state.wishlist?.items ?? []);
  const dispatch = useDispatch();
  const router = useRouter();
  const { getToken } = useAuth();

  const [mainImage, setMainImage] = useState(
    Array.isArray(product.images) && product.images.length ? product.images[0] : ""
  );

  const [ratingsArray, setRatingsArray] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // 🔄 Fetch latest rating info
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

        const avg =
          arr.length > 0
            ? arr.reduce((acc, r) => acc + (r.rating || 0), 0) / arr.length
            : 0;
        setAverageRating(avg);
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

    fetchRatings();
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  // 🛒 Add to Cart handler
  const addToCartHandler = () => {
    if (!product.inStock) return;
    dispatch(addToCart({ productId }));
  };

  // 💰 Currency formatting
  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  // 🧩 Stock Label Helper
  const getStockLabel = (p) => {
    if (!p?.inStock) return { text: "Out of Stock", tone: "red" };
    if (typeof p?.stock === "number") {
      if (p.stock <= 0) return { text: "Out of Stock", tone: "red" };
      if (p.stock < 5) return { text: `Only ${p.stock} left`, tone: "orange" };
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
                className={`bg-white border border-gray-200 flex items-center justify-center w-20 h-20 rounded-none cursor-pointer transition-all ${mainImage === image ? "border-black ring-1 ring-black" : "hover:border-black"
                  }`}
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
            <div className="text-gray-400 text-sm">No images</div>
          )}
        </div>

        <div className="flex justify-center items-center">
          <div className="w-[500px] h-[500px] bg-white border border-gray-100 rounded-none overflow-hidden flex items-center justify-center">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain block hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-gray-400 text-sm">No image available</div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- PRODUCT INFO SECTION ---------- */}
      <div className="flex-1 pt-4">
        <h1 className="text-4xl font-bold text-black uppercase tracking-wide font-serif mb-2">{product.name}</h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-4">{product.category}</p>

        {/* ---------- RATINGS ---------- */}
        <div className="flex items-center mb-6">
          {Array(5)
            .fill("")
            .map((_, i) => {
              const filled = roundedRating >= i + 1;
              return (
                <StarIcon
                  key={i}
                  size={16}
                  fill={filled ? "black" : "none"}
                  stroke={filled ? "black" : "#D1D5DB"}
                  className="mr-1"
                />
              );
            })}
          <span className="ml-3 text-xs font-bold uppercase tracking-wider text-black border-b border-black cursor-pointer">
            {ratingsArray.length} {ratingsArray.length === 1 ? "Review" : "Reviews"}
          </span>
        </div>

        <div className="h-px bg-gray-200 w-full mb-6"></div>

        {/* ---------- PRICE ---------- */}
        <div className="flex items-end mb-6 gap-4">
          <p className="text-3xl font-bold text-black font-serif">{fmt.format(product.price)}</p>
          {typeof product.mrp === "number" && product.mrp > product.price && (
            <p className="text-lg text-gray-400 line-through mb-1">
              {fmt.format(product.mrp)}
            </p>
          )}
        </div>

        {/* ---------- STOCK LABEL ---------- */}
        <div className="mb-4">
          <p
            className={`text-xs font-bold uppercase tracking-widest ${stockLabel.tone === "green"
              ? "text-green-700"
              : stockLabel.tone === "orange"
                ? "text-orange-600"
                : "text-red-600"
              }`}
          >
            {stockLabel.text}
          </p>
        </div>

        {/* ---------- DISCOUNT ---------- */}
        {typeof product.mrp === "number" && product.mrp > product.price && (
          <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 mb-8">
            <TagIcon size={14} className="text-white" />
            <p className="text-xs font-bold uppercase tracking-wider">
              Save {(((product.mrp - product.price) / product.mrp) * 100).toFixed(0)}%
            </p>
          </div>
        )}

        {/* ---------- ADD TO CART ---------- */}
        <div className="flex flex-col gap-6 mt-4">
          {cart[productId] && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-black uppercase tracking-widest">Quantity</p>
              <div className="w-fit border border-black">
                <Counter productId={productId} />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() =>
                !cart[productId] ? addToCartHandler() : router.push("/cart")
              }
              disabled={!product.inStock}
              className={`flex-1 px-8 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all duration-300 border ${product.inStock
                ? "bg-black text-white border-black hover:bg-white hover:text-black"
                : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                }`}
              type="button"
            >
              {!product.inStock
                ? "Out of Stock"
                : !cart[productId]
                  ? "Add to Cart"
                  : "View Cart"}
            </button>

            <button
              onClick={() => dispatch(toggleWishlist({ productId, getToken }))}
              className={`px-4 py-4 border transition-colors ${wishlistItems.some(item => item.productId === productId)
                ? "border-red-500 bg-red-50 text-red-500"
                : "border-gray-300 hover:border-black text-black"
                }`}
              title={wishlistItems.some(item => item.productId === productId) ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart
                size={20}
                className={wishlistItems.some(item => item.productId === productId) ? "fill-current" : ""}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500 leading-relaxed max-w-md">
          <p className="mb-2"><span className="font-bold text-black uppercase mr-2">Free Shipping</span> On orders over {currencySymbol}999</p>
          <p><span className="font-bold text-black uppercase mr-2">Returns</span> Easy 30-day return policy</p>
        </div>

        <hr className="border-gray-200 my-8" />

        {/* ---------- DELIVERY INFO ---------- */}
        <div className="flex flex-col gap-4 text-gray-500 text-sm">
          <DeliveryByText />
          <p className="flex gap-3 items-center">
            <CreditCardIcon className="text-gray-400" size={18} />
            <span>100% Secured Payment</span>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ---------- DELIVERY ETA ---------- */
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
    <p className="flex gap-3 items-center text-gray-600">
      <EarthIcon className="text-gray-400" size={18} />
      <span>
        Delivery within 7 days —{" "}
        <span className="font-bold text-black uppercase tracking-wide">by {formatted}</span>
      </span>
    </p>
  );
}

export default ProductDetails;
