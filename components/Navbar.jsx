"use client";

import {
  PackageIcon,
  Search,
  ShoppingCart,
  MoreVertical,
  X,
  User,
  Heart
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchWishlist } from "@/lib/features/wishlist/wishlistSlice";
import { fetchCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { useUser, useClerk, useAuth, UserButton } from "@clerk/nextjs";
import Image from "next/image";

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn, signOut } = useClerk();
  const { getToken } = useAuth(); // Needed for thunks
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const cartCount = useSelector((state) => state.cart.total);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);
  const searchRef = useRef(null);

  // Sync Cart & Wishlist on load/user change
  useEffect(() => {
    dispatch(fetchCart({ getToken }));
    dispatch(fetchWishlist({ getToken }));
  }, [user, dispatch, getToken]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!search) return;
    router.push(`/shop?q=${encodeURIComponent(search)}`);
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };




  const handleLogin = () => {
    if (user) {
      router.push("/orders");
    } else {
      openSignIn({ afterSignInUrl: "/" });
    }
  };

  // Close popovers on history change
  useEffect(() => {
    const closeAll = () => {
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
    };
    const onPop = () => closeAll();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  // Prefetch shop page
  useEffect(() => {
    try {
      router.prefetch("/shop");
    } catch { }
  }, [router]);

  return (
    <nav className="relative bg-white z-50">
      {/* Announcement Bar */}
      <div className="bg-black text-white text-[10px] md:text-xs font-bold text-center py-2 uppercase tracking-[0.2em]">
        Free Shipping on all orders over ₹999
      </div>

      <div className="border-b border-black">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tighter uppercase leading-none group-hover:opacity-80 transition-opacity">
                Mooi
              </h1>
              <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-gray-500 group-hover:text-black transition-colors font-bold text-justify w-full flex justify-between">
                <span>Professional</span>
              </p>
            </div>
          </Link>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-12">
            <nav className="flex items-center gap-8 text-black">
              {[
                { href: "/", label: "Home" },
                { href: "/shop", label: "Shop" },
                { href: "/about", label: "Our Story" }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative group text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  {item.label}
                  <span className="absolute left-0 -bottom-1 w-0 h-[1px] bg-black transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>
          </div>

          {/* Center Search (Large Screens) */}
          <form
            onSubmit={handleSearch}
            className="hidden xl:flex items-center border-b border-gray-300 focus-within:border-black transition-colors px-0 py-1 mx-8 flex-1 max-w-sm"
          >
            <Search size={16} className="text-gray-400" />
            <input
              className="w-full bg-transparent outline-none placeholder-gray-400 text-xs uppercase tracking-wider font-medium ml-3"
              type="text"
              placeholder="Search Essentials"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          {/* Right: Icons */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5">
              {/* Search (Mobile Popover) */}
              <div className="relative xl:hidden">
                <button
                  type="button"
                  className="hover:scale-110 transition-transform text-black"
                  onClick={() => {
                    setMobileSearchOpen((s) => !s);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Search size={20} strokeWidth={1.5} />
                </button>

                {mobileSearchOpen && (
                  <div className="absolute right-0 top-12 z-[70] w-screen max-w-md bg-white border border-black p-0 drop-shadow-xl animate-in fade-in slide-in-from-top-2">
                    <form
                      onSubmit={handleSearch}
                      className="flex items-stretch"
                    >
                      <input
                        ref={searchRef}
                        className="flex-1 outline-none text-sm p-4 uppercase tracking-wide placeholder-gray-400"
                        type="text"
                        placeholder="SEARCH PRODUCTS..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-6 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                      >
                        Search
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Wishlist Placeholder -> Real Link */}
              <button
                className="hidden sm:block hover:scale-110 transition-transform text-black relative group"
                onClick={() => router.push("/wishlist")} // Future page
              >
                <Heart size={20} strokeWidth={1.5} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 text-[9px] font-bold text-white bg-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              {/* Cart */}
              <Link href="/cart" className="hover:scale-110 transition-transform text-black relative">
                <ShoppingCart size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 text-[9px] font-bold text-white bg-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Login / User (desktop) */}
              <div className="hidden sm:flex items-center border-l border-gray-300 pl-6">
                {!user ? (
                  <button
                    type="button"
                    onClick={handleLogin}
                    className="text-xs font-bold uppercase tracking-widest hover:underline decoration-1 underline-offset-4"
                  >
                    Login
                  </button>
                ) : (
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Action
                        labelIcon={<PackageIcon size={16} />}
                        label="My Orders"
                        onClick={() => router.push("/orders")}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="lg:hidden relative">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen((p) => !p);
                  setMobileSearchOpen(false);
                }}
                className="hover:bg-gray-100 p-1 transition-colors text-black"
              >
                <MoreVertical size={24} strokeWidth={1.5} />
              </button>

              {/* Backdrop */}
              {(mobileMenuOpen || mobileSearchOpen) && (
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileSearchOpen(false);
                  }}
                />
              )}

              {/* Mobile Menu Panel */}
              {mobileMenuOpen && (
                <div
                  className="fixed right-0 top-0 h-full w-[300px] z-[80] p-8 flex flex-col bg-white border-l border-black shadow-2xl animate-in slide-in-from-right duration-300"
                >
                  <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-4">
                    <h2 className="text-2xl font-serif font-bold uppercase tracking-tighter">Menu</h2>
                    <button onClick={() => setMobileMenuOpen(false)} className="hover:rotate-90 transition-transform">
                      <X size={24} />
                    </button>
                  </div>

                  {/* Products (mobile) */}
                  <div className="flex flex-col gap-6">
                    {[
                      { href: "/", label: "Home" },
                      { href: "/shop", label: "Shop Products" },
                      { href: "/wishlist", label: `My Favorites (${wishlistItems.length})` },
                      { href: "/about", label: "Our Story" },
                      { href: "/cart", label: `My Cart (${cartCount})` }
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-sm font-bold uppercase tracking-widest hover:text-gray-500 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-auto pt-6 border-t border-gray-100">
                    {user ? (
                      <div className="flex flex-col gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            router.push("/orders");
                          }}
                          className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider"
                        >
                          <PackageIcon size={18} /> My Orders
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setMobileMenuOpen(false);
                            try {
                              await signOut();
                            } catch (err) { }
                            try {
                              router.push("/");
                            } catch { }
                          }}
                          className="mt-4 w-full py-4 border border-black text-black uppercase tracking-widest text-xs font-bold hover:bg-black hover:text-white transition-all text-center"
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogin();
                        }}
                        className="w-full py-4 bg-black text-white hover:bg-zinc-800 text-xs uppercase tracking-widest font-bold transition-all"
                      >
                        Login / Register
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;