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
    <div className="min-h-screen mx-6 text-slate-800">
      <div className="max-w-7xl mx-auto">
        <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

        <div className="flex items-start justify-between gap-5 max-lg:flex-col">
          <table className="w-full max-w-4xl text-slate-600 table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th className="max-md:hidden">Remove</th>
              </tr>
            </thead>
            <tbody>
              {cartArray.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="flex gap-3 my-4">
                    <div className="flex items-center justify-center bg-slate-100 size-18 rounded-md overflow-hidden">
                      <Image
                        src={item?.images?.[0] ?? ""}
                        className="h-14 w-auto"
                        alt={item?.name ?? ""}
                        width={56}
                        height={56}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{item?.name}</p>
                      <p className="text-xs text-slate-500">{item?.category}</p>
                      <p>
                        {currency}
                        {item?.price}
                      </p>
                    </div>
                  </td>
                  <td className="text-center">
                    <Counter productId={item?.id} />
                  </td>
                  <td className="text-center">
                    {currency}
                    {(Number(item?.price || 0) * Number(item?.quantity || 0)).toLocaleString()}
                  </td>
                  <td className="text-center max-md:hidden">
                    <button
                      onClick={() => handleDeleteItemFromCart(item?.id)}
                      className="text-red-500 hover:bg-red-50 p-2.5 rounded-full"
                    >
                      <Trash2Icon size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ✅ Order Summary handles Subtotal + Shipping + GST + Payable */}
          <OrderSummary totalPrice={totalPrice} items={cartArray} />
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
      <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
    </div>
  );
}
