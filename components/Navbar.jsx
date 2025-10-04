"use client";

import {
  PackageIcon,
  Search,
  ShoppingCart,
  MoreVertical,
  ChevronDown,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import {
  MotionConfig,
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import logo from "../assets/logo.png";

const spring = { type: "spring", stiffness: 320, damping: 28 };
const fade = { type: "tween", duration: 0.18 };

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const cartCount = useSelector((state) => state.cart.total);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const searchRef = useRef(null);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!search) return;
    router.push(`/shop?search=${encodeURIComponent(search)}`);
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    if (user) {
      router.push("/orders");
      return;
    }
    openSignIn({ afterSignInUrl: "/" });
  };

  // Close popovers on history change
  useEffect(() => {
    const closeAll = () => {
      setMobileMenuOpen(false);
      setMobileSearchOpen(false);
      setMobileProductsOpen(false);
    };
    const onPop = () => closeAll();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <nav className="relative bg-white shadow-sm">
        <div className="mx-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto py-3 md:py-4">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-3">
              <motion.div
                className="relative h-12 w-[160px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: spring }}
              >
                <Image
                  src={logo}
                  alt="logo"
                  width={160}
                  height={48}
                  style={{ objectFit: "contain" }}
                  priority
                />
              </motion.div>
            </Link>

            {/* Desktop menu */}
            <div className="hidden sm:flex items-center gap-6 md:gap-8">
              <nav className="flex items-center gap-6 text-slate-700">
                {/* Products Dropdown (desktop) */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0, transition: spring }}
                  className="relative group"
                >
                  <button
                    type="button"
                    className="flex items-center gap-1 group-hover:text-emerald-600 transition"
                  >
                    Products <ChevronDown size={16} />
                  </button>

                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute left-0 top-7 bg-white shadow-lg rounded-lg border border-slate-100 w-48 opacity-0 group-hover:opacity-100 transition-opacity p-2 z-50"
                  >
                    <Link
                      href="/shop"
                      className="block w-full text-left p-2 rounded hover:bg-emerald-50 hover:text-emerald-700 transition"
                    >
                      All Products
                    </Link>
                    <Link
                      href="/shop?category=hair-care"
                      className="block w-full text-left p-2 rounded hover:bg-emerald-50 hover:text-emerald-700 transition"
                    >
                      Hair Care
                    </Link>
                    <Link
                      href="/shop?category=skin-care"
                      className="block w-full text-left p-2 rounded hover:bg-emerald-50 hover:text-emerald-700 transition"
                    >
                      Skin Care
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Static Links */}
                {[
                  { href: "/", label: "Home" },
                  { href: "/about", label: "About" },
                  { href: "/contact", label: "Contact" },
                ].map((item) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: spring }}
                  >
                    <Link href={item.href} className="relative group">
                      {item.label}
                      <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-emerald-600 transition-all group-hover:w-full" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Desktop Search */}
              <motion.form
                onSubmit={handleSearch}
                className="hidden xl:flex items-center bg-slate-100 px-4 py-2 rounded-full"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: spring }}
              >
                <input
                  className="w-56 bg-transparent outline-none placeholder-slate-600 text-sm"
                  type="text"
                  placeholder="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </motion.form>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-3">
              {/* Search (Mobile Popover) */}
              <div className="relative sm:hidden">
                <motion.button
                  type="button"
                  className="p-2 rounded-full hover:bg-slate-100"
                  onClick={() => {
                    setMobileSearchOpen((s) => !s);
                    setMobileMenuOpen(false);
                  }}
                  aria-label="Open search"
                  whileTap={{ scale: 0.92 }}
                  aria-expanded={mobileSearchOpen}
                >
                  {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
                </motion.button>

                <AnimatePresence>
                  {mobileSearchOpen && (
                    <motion.form
                      key="search-pop"
                      onSubmit={handleSearch}
                      className="absolute right-0 top-10 z-[70] w-72 bg-white border rounded-md shadow-md p-2 flex items-center gap-2"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
                      exit={{ opacity: 0, y: -6, scale: 0.98, transition: fade }}
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
                      <motion.button
                        type="submit"
                        className="px-3 py-1 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                        whileTap={{ scale: 0.96 }}
                      >
                        Go
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 rounded-full hover:bg-slate-100">
                <motion.span whileTap={{ scale: 0.92 }}>
                  <ShoppingCart size={20} />
                </motion.span>
                {cartCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-0.5 text-[10px] text-white bg-emerald-600 px-1.5 py-0.5 rounded-full"
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, transition: spring }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>

              {/* Login / User */}
              <div className="hidden sm:flex items-center">
                {!user ? (
                  <motion.button
                    type="button"
                    onClick={handleLogin}
                    className="ml-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm"
                    whileTap={{ scale: 0.96 }}
                  >
                    Login
                  </motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: fade }}>
                    <UserButton>
                      <UserButton.MenuItems>
                        <UserButton.Action
                          labelIcon={<PackageIcon size={16} />}
                          label="My Orders"
                          onClick={() => router.push("/orders")}
                        />
                      </UserButton.MenuItems>
                    </UserButton>
                  </motion.div>
                )}
              </div>

              {/* Mobile Menu */}
              <div className="sm:hidden relative">
                <motion.button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen((p) => !p);
                    setMobileSearchOpen(false);
                  }}
                  className="p-2 rounded-full hover:bg-slate-100"
                  aria-label="Open menu"
                  whileTap={{ scale: 0.92 }}
                  aria-expanded={mobileMenuOpen}
                >
                  <MoreVertical size={22} />
                </motion.button>

                {/* Backdrop */}
                <AnimatePresence>
                  {(mobileMenuOpen || mobileSearchOpen) && (
                    <motion.div
                      key="backdrop"
                      className="fixed inset-0 bg-black/20 z-40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: fade }}
                      exit={{ opacity: 0, transition: fade }}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileSearchOpen(false);
                        setMobileProductsOpen(false);
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Mobile Menu Panel (fixed + high z-index) */}
                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div
                      key="mobile-menu"
                      className="fixed right-3 top-16 bg-white border shadow-lg rounded-xl w-[88vw] max-w-[360px] z-[60] p-2 flex flex-col text-sm origin-top-right"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
                      exit={{ opacity: 0, y: -6, scale: 0.98, transition: fade }}
                      role="dialog"
                      aria-modal="true"
                    >
                      {/* Products Dropdown (mobile) */}
                      <motion.button
                        type="button"
                        onClick={() => setMobileProductsOpen((v) => !v)}
                        className="flex items-center justify-between w-full p-2 hover:bg-slate-100 rounded"
                        aria-expanded={mobileProductsOpen}
                        aria-controls="mobile-products-sub"
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="flex items-center gap-2 font-medium">Products</span>
                        <motion.span
                          animate={{ rotate: mobileProductsOpen ? 180 : 0 }}
                          transition={spring}
                        >
                          <ChevronDown size={16} />
                        </motion.span>
                      </motion.button>

                      <AnimatePresence initial={false}>
                        {mobileProductsOpen && (
                          <motion.div
                            id="mobile-products-sub"
                            key="products-sub"
                            className="pl-4 flex flex-col gap-1 mb-1 overflow-hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto", transition: spring }}
                            exit={{ opacity: 0, height: 0, transition: fade }}
                          >
                            <Link
                              href="/shop"
                              className="block text-sm p-2 text-left hover:bg-slate-100 rounded"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileProductsOpen(false);
                              }}
                            >
                              All Products
                            </Link>
                            <Link
                              href="/shop?category=hair-care"
                              className="block text-sm p-2 text-left hover:bg-slate-100 rounded"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileProductsOpen(false);
                              }}
                            >
                              Hair Care
                            </Link>
                            <Link
                              href="/shop?category=skin-care"
                              className="block text-sm p-2 text-left hover:bg-slate-100 rounded"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileProductsOpen(false);
                              }}
                            >
                              Skin Care
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>

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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />
      </nav>
    </MotionConfig>
  );
};

export default Navbar;
