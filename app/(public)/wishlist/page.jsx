'use client'

import { useSelector } from "react-redux"
import PageTitle from "@/components/PageTitle"
import ProductCard from "@/components/ProductCard"
import Loading from "@/components/Loading"
import { Heart } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs" // Wait, actually useSelector is enough if already fetched. But we might want useUser/useAuth to check login state.

export default function Wishlist() {
    const { items: wishlistItems, loading } = useSelector((state) => state.wishlist)
    const { isLoaded, isSignedIn } = useAuth(); // Clerk hook to check if user needs to login

    if (loading || !isLoaded) return <Loading />

    if (!isSignedIn) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
                <Heart size={64} className="text-gray-200" />
                <div className="text-center">
                    <h1 className="text-2xl font-serif font-bold uppercase tracking-widest mb-2">My Wishlist</h1>
                    <p className="text-gray-500 mb-6">Create an account to save your favorite products.</p>
                    <Link href="/sign-in" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors">
                        Login / Register
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <PageTitle heading="My Wishlist" text={`${wishlistItems.length} Saved Items`} linkText="Continue Shopping" />

                {wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 gap-y-12 mt-12">
                        {wishlistItems.map((item) => (
                            <div key={item.productId} className="w-full animate-in fade-in duration-500">
                                {/* Use ProductCard but make sure it handles the item structure correctly. 
                                    Wishlist API returns items with `product` relation. 
                                    ProductCard expects `product` object. 
                                */}
                                <ProductCard product={item.product} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <Heart size={48} className="text-gray-200" />
                        <div className="text-center">
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Your wishlist is empty</h2>
                            <p className="text-gray-500 mb-6 max-w-md">Browse our collection and save your favorite items here.</p>
                            <Link href="/shop" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors">
                                Go to Shop
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
