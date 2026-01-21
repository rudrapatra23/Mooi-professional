'use client';
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Cart() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  const reduxCart = useSelector((state) => state?.cart ?? {});
  const cartItems = reduxCart?.cartItems ?? {};
  const products = useSelector((state) => state?.product?.list ?? []);
  const safeProducts = Array.isArray(products) ? products : [];

  const dispatch = useDispatch();

  const [cartArray, setCartArray] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const buildCartFromProducts = (productList) => {
    let nextTotal = 0;
    const next = [];
    const safeCartItems = cartItems && typeof cartItems === "object" ? cartItems : {};

    for (const [key, value] of Object.entries(safeCartItems)) {
      const product = productList.find((p) => String(p?.id) === String(key));
      if (product) {
        const qty = Number(value) || 0;
        next.push({ ...product, quantity: qty });
        nextTotal += (Number(product.price) || 0) * qty;
      }
    }
    setCartArray(next);
    setTotalPrice(nextTotal);
  };

  useEffect(() => {
    if (safeProducts.length > 0) {
      buildCartFromProducts(safeProducts);
      return;
    }

    const hasCartItems = Object.keys(cartItems || {}).length > 0;
    if (!hasCartItems) {
      setCartArray([]);
      setTotalPrice(0);
    }
  }, [safeProducts.length, JSON.stringify(cartItems)]);

  useEffect(() => {
    if (Array.isArray(safeProducts) && safeProducts.length > 0) return;
    const productIds = Object.keys(cartItems || {});
    if (!productIds.length) return;
    let cancelled = false;

    (async () => {
      try {
        const fetches = productIds.map((id) =>
          fetch(`/api/product?productId=${encodeURIComponent(id)}`).then(async (res) => {
            if (!res.ok) return null;
            const json = await res.json();
            return json?.product ?? null;
          }).catch(() => null)
        );

        const results = await Promise.all(fetches);
        if (cancelled) return;

        const fetchedProducts = results.filter(Boolean);
        if (fetchedProducts.length > 0) {
          buildCartFromProducts(fetchedProducts);
        } else {
          setCartArray([]);
          setTotalPrice(0);
        }
      } catch {
        if (!cancelled) {
          setCartArray([]);
          setTotalPrice(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(cartItems), safeProducts.length]);

  const handleDeleteItemFromCart = (productId) => {
    dispatch(deleteItemFromCart({ productId }));
  };

  return Array.isArray(cartArray) && cartArray.length > 0 ? (
    <div className="min-h-screen bg-white pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 border-b border-black pb-4">
          <h1 className="text-3xl font-serif font-bold tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest">{cartArray.length} Items</p>
        </div>

        <div className="flex items-start justify-between gap-10 max-lg:flex-col">
          <div className="flex-1 w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="py-4 text-xs font-bold uppercase tracking-widest text-black/60">Product</th>
                  <th className="py-4 text-xs font-bold uppercase tracking-widest text-black/60 text-center">Quantity</th>
                  <th className="py-4 text-xs font-bold uppercase tracking-widest text-black/60 text-right">Total</th>
                  <th className="max-md:hidden py-4 text-xs font-bold uppercase tracking-widest text-black/60 text-center">Remove</th>
                </tr>
              </thead>
              <tbody>
                {cartArray.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 group">
                    <td className="py-6">
                      <div className="flex gap-4">
                        <div className="relative w-24 h-24 bg-gray-50 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                          <Image
                            src={item?.images?.[0] ?? ""}
                            className="max-h-20 w-auto object-contain mix-blend-multiply"
                            alt={item?.name ?? ""}
                            width={96}
                            height={96}
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="font-bold text-sm uppercase tracking-wide text-black mb-1">{item?.name}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{item?.category}</p>
                          <p className="font-serif text-lg">
                            {currency}
                            {item?.price}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 text-center align-middle">
                      <div className="inline-block border border-black p-1">
                        <Counter productId={item?.id} />
                      </div>
                    </td>
                    <td className="py-6 text-right align-middle font-serif text-lg font-medium">
                      {currency}
                      {(Number(item?.price || 0) * Number(item?.quantity || 0)).toLocaleString()}
                    </td>
                    <td className="py-6 text-center align-middle max-md:hidden">
                      <button
                        onClick={() => handleDeleteItemFromCart(item?.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2"
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-8">
              <button className="text-xs font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-600 transition-colors">
                Continue Shopping
              </button>
            </div>
          </div>

          {/* ✅ Order Summary handles Subtotal + Shipping + GST + Payable */}
          <div className="w-full lg:w-[350px] bg-gray-50 p-6 border border-gray-100">
            <OrderSummary totalPrice={totalPrice} items={cartArray} />
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-[60vh] mx-6 flex flex-col items-center justify-center text-slate-800">
      <h1 className="text-4xl font-serif mb-4">Your cart is empty</h1>
      <p className="text-gray-500 mb-8 max-w-sm text-center">Looks like you haven't added anything to your cart yet.</p>
      <a href="/shop" className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Start Shopping</a>
    </div>
  );
}
