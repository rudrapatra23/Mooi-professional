"use client";

import {
  PackageIcon,
  Search,
  ShoppingCart,
  MoreVertical,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import logo from "../assets/logo.png";

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const cartCount = useSelector((state) => state.cart.total);
  const searchRef = useRef(null);

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
    } catch {}
  }, [router]);

  return (
    <nav className="relative bg-white shadow-sm">
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-3 md:py-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={logo}
              alt="logo"
              width={160}
              height={48}
              className="w-[160px] h-auto"
              priority
            />
          </Link>

          {/* Desktop menu */}
          <div className="hidden sm:flex items-center gap-6 md:gap-8">
            <nav className="flex items-center gap-6 text-slate-700">
              {/* Products Link */}
              <Link href="/shop" prefetch className="relative group">
                Products
                <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-emerald-600 transition-all group-hover:w-full" />
              </Link>

              {/* Static Links */}
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="relative group">
                  {item.label}
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-emerald-600 transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Desktop Search */}
            <form
              onSubmit={handleSearch}
              className="hidden xl:flex items-center bg-slate-100 px-4 py-2 rounded-full"
            >
              <input
                className="w-56 bg-transparent outline-none placeholder-slate-600 text-sm"
                type="text"
                placeholder="Search products"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-3">
            {/* Search (Mobile Popover) */}
            <div className="relative sm:hidden">
              <button
                type="button"
                className="p-2 rounded-full hover:bg-slate-100"
                onClick={() => {
                  setMobileSearchOpen((s) => !s);
                  setMobileMenuOpen(false);
                }}
                aria-label="Open search"
                aria-expanded={mobileSearchOpen}
              >
                {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
              </button>

              {mobileSearchOpen && (
                <form
                  onSubmit={handleSearch}
                  className="absolute right-0 top-10 z-[70] w-72 bg-white border rounded-md shadow-md p-2 flex items-center gap-2"
                >
                  <input
                    ref={searchRef}
                    className="w-full outline-none text-sm"
                    type="text"
                    placeholder="Search products"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                  >
                    Go
                  </button>
                </form>
              )}
            </div>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-full hover:bg-slate-100">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-0.5 text-[10px] text-white bg-emerald-600 px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Login / User */}
            <div className="hidden sm:flex items-center">
              {!user ? (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="ml-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm"
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

            {/* Mobile Menu */}
            <div className="sm:hidden relative">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen((p) => !p);
                  setMobileSearchOpen(false);
                }}
                className="p-2 rounded-full hover:bg-slate-100"
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <MoreVertical size={22} />
              </button>

              {/* Backdrop */}
              {(mobileMenuOpen || mobileSearchOpen) && (
                <div
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileSearchOpen(false);
                  }}
                />
              )}

              {/* Mobile Menu Panel */}
              {mobileMenuOpen && (
                <div
                  className="fixed right-3 top-16 bg-white border shadow-lg rounded-xl w-[88vw] max-w-[360px] z-[60] p-2 flex flex-col text-sm"
                  role="dialog"
                  aria-modal="true"
                >
                  {/* Products (mobile) */}
                  <Link
                    href="/shop"
                    className="p-2 hover:bg-slate-100 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>

                  <Link
                    href="/"
                    className="p-2 hover:bg-slate-100 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className="p-2 hover:bg-slate-100 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="p-2 hover:bg-slate-100 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact
                  </Link>

                  <div className="border-t my-1" />

                  <Link
                    href="/cart"
                    className="p-2 hover:bg-slate-100 rounded flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart size={16} /> Cart
                    <span className="ml-auto text-xs bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  </Link>

                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push("/orders");
                      }}
                      className="p-2 hover:bg-slate-100 rounded flex items-center gap-2"
                    >
                      <PackageIcon size={16} /> My Orders
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogin();
                      }}
                      className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                    >
                      Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />
    </nav>
  );
};

export default Navbar;
