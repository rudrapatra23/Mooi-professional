// components/ProductCard.jsx
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ProductCard = ({ product }) => {
  const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  const rating =
    Array.isArray(product?.rating) && product.rating.length > 0
      ? Math.round(product.rating.reduce((acc, curr) => acc + curr.rating, 0) / product.rating.length)
      : 0;

  // Choose first non-empty image or tiny placeholder
  const imgSrc =
    Array.isArray(product?.images) && product.images.find((s) => typeof s === "string" && s.trim().length > 0)
      ? product.images.find((s) => typeof s === "string" && s.trim().length > 0)
      : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12NgYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==";

  // stock label helper
  const getStockLabel = (p) => {
    if (!p?.inStock) return { text: "Out of stock", tone: "red" };
    if (typeof p?.stock === "number") {
      if (p.stock === 0) return { text: "Out of stock", tone: "red" };
      if (p.stock < 5) return { text: `Only ${p.stock} left`, tone: "orange" };
    }
    return { text: "In stock", tone: "green" };
  };

  const stockLabel = getStockLabel(product);

  // price formatting (EN-IN)
  const fmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  // Discount calculation
  const mrp = typeof product?.mrp === "number" ? product.mrp : Number(product?.mrp || 0);
  const price = typeof product?.price === "number" ? product.price : Number(product?.price || 0);
  const hasDiscount = mrp > 0 && price < mrp;
  const discountPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block w-full"
      prefetch
    >
      {/* Image: using aspect ratio box to avoid layout shifts/overlap */}
      <div className="w-full">
        <div
          className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-[#F5F5F5]"
          style={{ paddingTop: "100%" }} // creates a square container (aspect ratio 1:1)
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={imgSrc}
              alt={product?.name || "product"}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 240px"
              style={{ objectFit: "contain", width: "100%", height: "100%" }}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded">
              {discountPercent}% OFF
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex justify-between gap-3 text-sm text-slate-800 pt-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{product?.name}</p>

          <div className="flex items-center mt-1 gap-3">
            <div className="flex -ml-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                  key={i}
                  size={14}
                  className="text-transparent mt-0.5"
                  fill={rating >= i + 1 ? "#00C950" : "#D1D5DB"}
                />
              ))}
            </div>

            <p
              className={`text-xs font-medium ${
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
        </div>

        <div className="flex flex-col items-end justify-start whitespace-nowrap">
          <div className="text-sm font-semibold">
            {fmt.format(price || 0)}
          </div>

          {hasDiscount && (
            <div className="text-xs text-slate-500 line-through -mt-0.5">
              {fmt.format(mrp)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
