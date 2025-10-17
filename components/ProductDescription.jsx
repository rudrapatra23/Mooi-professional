"use client";

import { ArrowRight, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

const ExternalImage = ({
  src,
  alt,
  width = 64,
  height = 64,
  className = "",
}) => {
  // Next/Image may require domain config for external images.
  // Use <img> fallback when src is external to avoid broken images in dev.
  const isExternal =
    typeof src === "string" &&
    (src.startsWith("http://") || src.startsWith("https://"));
  if (!src) {
    return (
      <div className={`w-${width} h-${height} bg-slate-100 ${className}`} />
    );
  }
  if (isExternal) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover rounded-full ${className}`}
      />
    );
  }
  // local/static image path — use Next Image
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`object-cover rounded-full ${className}`}
    />
  );
};

const ProductDescription = ({ product }) => {
  const [selectedTab, setSelectedTab] = useState("Description");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviewsForProduct = useCallback(async () => {
    if (!product?.id) return;
    setError(null);
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/rating/${product.id}`);
      console.log("fetch /api/rating status:", res.status);
      const ct = res.headers.get("content-type") || "";
      let data;
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        // fallback: try parse text (for debugging) then treat as no reviews
        const txt = await res.text();
        console.warn("Non-json response from /api/rating:", txt.slice(0, 500));
        data = [];
      }

      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
        ? data.rows
        : Array.isArray(data?.ratings)
        ? data.ratings
        : [];

      setReviews(arr);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError("Failed to load reviews");
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [product?.id]);

  useEffect(() => {
    let cancelled = false;
    // If user opens Reviews tab, decide whether to use embedded or fetch
    async function prepareReviews() {
      if (selectedTab !== "Reviews") return;

      // if product has embedded rating array and it's non-empty, use it
      if (Array.isArray(product?.rating) && product.rating.length > 0) {
        if (!cancelled) setReviews(product.rating);
        return;
      }

      // otherwise fetch from API
      await fetchReviewsForProduct();
    }

    prepareReviews();

    return () => {
      cancelled = true;
    };
  }, [selectedTab, product?.rating, fetchReviewsForProduct]);

  return (
    <div className="my-18 text-sm text-slate-600">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
        {["Description", "Reviews"].map((tab, idx) => (
          <button
            key={idx}
            className={`${
              tab === selectedTab
                ? "border-b-[1.5px] font-semibold"
                : "text-slate-400"
            } px-3 py-2 font-medium`}
            onClick={() => setSelectedTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Description */}
      {selectedTab === "Description" && (
        <p className="max-w-xl">
          {product?.description ?? "No description available."}
        </p>
      )}

      {/* Reviews */}
      {selectedTab === "Reviews" && (
        <div className="flex flex-col gap-3 mt-14">
          {loadingReviews ? (
            <p className="text-sm text-slate-400">Loading reviews...</p>
          ) : error ? (
            <p className="text-sm text-red-500">Error loading reviews.</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No reviews yet.</p>
          ) : (
            reviews.map((item, index) => {
              const score = item.rating ?? 0;
              const text = item.review ?? "";
              const user = item.user ?? {};
              const name = user?.name ?? "Verified Buyer";
              const avatar = user?.image ?? "/default-avatar.png";
              const createdAt = item.createdAt
                ? new Date(item.createdAt)
                : null;

              return (
                <div key={item.id ?? index} className="flex gap-5 mb-10">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                    <ExternalImage
                      src={avatar}
                      alt={name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {Array(5)
                          .fill("")
                          .map((_, i) => {
                            const filled = score >= i + 1;
                            return (
                              <StarIcon
                                key={i}
                                size={18}
                                className="mr-1"
                                // fill the star when rated, otherwise keep no fill
                                fill={filled ? "#FACC15" : "none"}
                                // stroke for outline color (slightly darker yellow when filled)
                                stroke={filled ? "#F59E0B" : "#9CA3AF"}
                              />
                            );
                          })}

                        <span className="ml-3 text-sm text-slate-500">
                          {name}
                        </span>
                      </div>

                      <div className="text-sm text-slate-400">{score}/5</div>
                    </div>

                    {text && <p className="text-sm max-w-lg my-4">“{text}”</p>}

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {createdAt ? (
                        <span>{createdAt.toDateString()}</span>
                      ) : null}
                      <Link href="#" className="flex items-center gap-1">
                        <ArrowRight size={12} /> Helpful
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDescription;
