'use client';
// app/(public)/shop/[username]/ProductGrid.jsx
import ProductCard from "@/components/ProductCard";

export default function ProductGrid({ products }) {
    if (!products || products.length === 0) {
        return <p className="text-slate-500">No products found.</p>;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
                <ProductCard key={p.id} product={p} />
            ))}
        </div>
    );
}
