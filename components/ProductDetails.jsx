"use client";

import { StarIcon, TagIcon, EarthIcon, CreditCardIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/lib/features/cart/cartSlice";

const ProductDetails = ({ product }) => {
  // defensive: if product missing, render nothing (parent already guards, but extra safety)
  if (!product) return null;

  const productId = product.id;
  const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  // safe cart selector: default to empty object if slice missing
  const cart = useSelector((state) => state.cart?.cartItems ?? {});
  const dispatch = useDispatch();
  const router = useRouter();

  // safe mainImage initialiser
  const [mainImage, setMainImage] = useState(
    Array.isArray(product.images) && product.images.length ? product.images[0] : ""
  );

  const addToCartHandler = () => {
    if (!product.inStock) return;
    dispatch(addToCart({ productId }));
  };

  // safe average rating calc
  const averageRating =
    Array.isArray(product.rating) && product.rating.length > 0
      ? product.rating.reduce((acc, item) => acc + (item.rating || 0), 0) /
        product.rating.length
      : 0;

  // price formatter
  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  // stock label
  const getStockLabel = (p) => {
    if (!p?.inStock) return { text: "Currently Out of Stock", tone: "red" };
    if (typeof p?.stock === "number") {
      if (p.stock === 0) return { text: "Currently Out of Stock", tone: "red" };
      if (p.stock < 5) return { text: `Hurry, only ${p.stock} left!`, tone: "orange" };
    }
    return { text: "In Stock", tone: "green" };
  };
  const stockLabel = getStockLabel(product);

  return (
    <div className="flex max-lg:flex-col gap-12">
      {/* Image section */}
      <div className="flex max-sm:flex-col-reverse gap-3">
        {/* Thumbnails */}
        <div className="flex sm:flex-col gap-3">
          {Array.isArray(product.images) && product.images.length ? (
            product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setMainImage(product.images[index])}
                className="bg-slate-100 flex items-center justify-center w-16 h-16 rounded-lg cursor-pointer"
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
            <div className="text-slate-400">No images</div>
          )}
        </div>

        {/* Main Image */}
        <div className="flex justify-center items-center">
          <div className="w-[400px] h-[400px] bg-white rounded-2xl overflow-hidden flex items-center justify-center shadow-md">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain block"
              />
            ) : (
              <div className="text-slate-400">No image available</div>
            )}
          </div>
        </div>
      </div>

      {/* Product info */}
      <div className="flex-1">
        <h1 className="text-3xl font-semibold text-slate-800">
          {product.name}
        </h1>

        {/* Ratings */}
        <div className="flex items-center mt-2">
          {Array(5)
            .fill("")
            .map((_, index) => (
              <StarIcon
                key={index}
                size={14}
                className="text-transparent mt-0.5"
                fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"}
              />
            ))}
          <p className="text-sm ml-3 text-slate-500">
            {Array.isArray(product.rating) ? product.rating.length : 0} Reviews
          </p>
        </div>

        {/* Prices */}
        <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
          <p>{fmt.format(product.price)}</p>
          {typeof product.mrp === "number" && product.mrp > product.price && (
            <p className="text-xl text-slate-500 line-through">
              {fmt.format(product.mrp)}
            </p>
          )}
        </div>

        {/* Stock info */}
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

        {/* Discount line */}
        {typeof product.mrp === "number" && product.mrp > product.price && (
          <div className="flex items-center gap-2 text-slate-500 mt-3">
            <TagIcon size={14} />
            <p>
              Save{" "}
              {(((product.mrp - product.price) / product.mrp) * 100).toFixed(0)}
              % right now
            </p>
          </div>
        )}

        {/* Cart buttons */}
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

        {/* Info lines */}
        <div className="flex flex-col gap-4 text-slate-500">
          <p className="flex gap-3">
            <EarthIcon className="text-slate-400" /> Free shipping on orders above
            ₹500
          </p>
          <p className="flex gap-3">
            <CreditCardIcon className="text-slate-400" /> 100% Secured Payment
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
