// components/ProductCard.jsx
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const ProductCard = ({ product }) => {
  const currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  const rating =
    product?.rating?.length
      ? Math.round(
          product.rating.reduce((acc, curr) => acc + curr.rating, 0) /
            product.rating.length
        )
      : 0;

  // Choose first non-empty image or tiny placeholder
  const imgSrc =
    product?.images?.find((s) => typeof s === "string" && s.trim().length > 0) ||
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQI12NgYGBgAAAABAABJzQnCgAAAABJRU5ErkJggg==";

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

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block max-w-[240px] mx-auto"
    >
      {/* Image */}
      <div className="bg-[#F5F5F5] w-[220px] h-[220px] sm:w-60 sm:h-60 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            src={imgSrc}
            alt={product?.name || "product"}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 220px"
            style={{ objectFit: "contain" }}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex justify-between gap-3 text-sm text-slate-800 pt-3 max-w-[220px]">
        <div className="min-w-0">
          <p className="truncate font-medium">{product?.name}</p>

          <div className="flex items-center mt-1 gap-3">
            <div className="flex">
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

        <div className="flex items-center justify-end whitespace-nowrap">
          <p className="font-semibold">
            {/* use Intl only for display; you can keep symbol too */}
            {fmt.format(product?.price ?? 0)}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
