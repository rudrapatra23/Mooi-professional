'use client';
// components/ProductCard.jsx
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/nextjs";
import { toggleWishlist } from "@/lib/features/wishlist/wishlistSlice";
import { memo, useState } from "react";

const ProductCard = memo(({ product }) => {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const [imageLoaded, setImageLoaded] = useState(false);

  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const inWishlist = wishlistItems.some((item) => item.productId === product.id);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist({ productId: product.id, getToken }));
  };

  const imgSrc =
    Array.isArray(product?.images) && product.images.find((s) => typeof s === "string" && s.trim().length > 0)
      ? product.images.find((s) => typeof s === "string" && s.trim().length > 0)
      : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12NgYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==";

  const getStockLabel = (p) => {
    if (!p?.inStock) return { text: "Out of stock", available: false };
    if (typeof p?.stock === "number") {
      if (p.stock === 0) return { text: "Out of stock", available: false };
      if (p.stock < 5) return { text: `Only ${p.stock} left`, available: true };
    }
    return { text: "In stock", available: true };
  };

  const stockLabel = getStockLabel(product);

  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const mrp = typeof product?.mrp === "number" ? product.mrp : Number(product?.mrp || 0);
  const price = typeof product?.price === "number" ? product.price : Number(product?.price || 0);
  const hasDiscount = mrp > 0 && price < mrp;
  const discountPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <Link href={`/product/${product.id}`} className="group block w-full" prefetch={false}>
      <div className="w-full">
        <div
          className="relative w-full overflow-hidden border border-gray-100 bg-white hover:border-black transition-colors duration-300"
          style={{ paddingTop: "100%" }}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-50 animate-pulse" />
          )}

          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all z-[5] group/heart"
            title={inWishlist ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Heart
              size={18}
              className={`transition-colors ${inWishlist ? "fill-black text-black" : "text-gray-400 group-hover/heart:text-black"}`}
            />
          </button>

          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={imgSrc}
              alt={product?.name || "product"}
              fill
              sizes="(max-width: 640px) 100vw, 240px"
              style={{ objectFit: "contain", width: "100%", height: "100%" }}
              className={`transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </div>

          {hasDiscount && (
            <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1">
              {discountPercent}% OFF
            </div>
          )}

          {!stockLabel.available && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider">
                Sold Out
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-3 text-sm text-slate-800 pt-3">
        <div className="min-w-0">
          <p className="truncate font-bold tracking-wide text-black uppercase text-xs">{product?.name}</p>
          <p className={`text-xs font-medium mt-1 ${stockLabel.available ? "text-gray-600" : "text-gray-400"}`}>
            {stockLabel.text}
          </p>
        </div>

        <div className="flex flex-col items-end justify-start whitespace-nowrap">
          <div className="text-sm font-semibold text-black">
            {fmt.format(price || 0)}
          </div>
          {hasDiscount && (
            <div className="text-xs text-gray-400 line-through -mt-0.5">
              {fmt.format(mrp)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
