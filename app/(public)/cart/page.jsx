'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

export default function Cart() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "₹";

  const { cartItems } = useSelector((state) => state.cart);
  const products = useSelector((state) => state.product.list);
  const dispatch = useDispatch();

  const [cartArray, setCartArray] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 220, damping: 20 },
    },
    exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
  };

  const createCartArray = () => {
    let nextTotal = 0;
    const next = [];

    for (const [key, value] of Object.entries(cartItems || {})) {
      const product = products.find((p) => String(p.id) === String(key));
      if (product) {
        next.push({ ...product, quantity: value });
        nextTotal += product.price * Number(value);
      }
    }

    setCartArray(next);
    setTotalPrice(nextTotal);
  };

  const handleDeleteItemFromCart = (productId) => {
    dispatch(deleteItemFromCart({ productId }));
  };

  useEffect(() => {
    if (products && products.length > 0) createCartArray();
  }, [cartItems, products]);

  const formattedTotal = useMemo(
    () => `${currency}${totalPrice.toLocaleString()}`,
    [currency, totalPrice]
  );

  return cartArray.length > 0 ? (
    <motion.div
      className="min-h-screen mx-6 text-slate-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 200, damping: 18 },
          }}
        >
          <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />
        </motion.div>

        <div className="flex items-start justify-between gap-5 max-lg:flex-col">
          <motion.table
            className="w-full max-w-4xl text-slate-600 table-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <thead>
              <tr className="max-sm:text-sm">
                <th className="text-left">Product</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th className="max-md:hidden">Remove</th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence initial={false}>
                {cartArray.map((item) => (
                  <motion.tr
                    key={String(item.id)}
                    variants={rowVariants}
                    exit="exit"
                    layout
                    className="space-x-2"
                  >
                    <motion.td className="flex gap-3 my-4" layout>
                      <motion.div
                        className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md overflow-hidden"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 250, damping: 16 }}
                      >
                        <Image
                          src={item.images?.[0]}
                          className="h-14 w-auto"
                          alt={item.name || ""}
                          width={56}
                          height={56}
                        />
                      </motion.div>
                      <div>
                        <p className="max-sm:text-sm">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                        <p>
                          {currency}
                          {item.price}
                        </p>
                      </div>
                    </motion.td>

                    <motion.td className="text-center" layout>
                      <Counter productId={item.id} />
                    </motion.td>

                    <motion.td className="text-center" layout>
                      {currency}
                      {(item.price * item.quantity).toLocaleString()}
                    </motion.td>

                    <motion.td className="text-center max-md:hidden" layout>
                      <motion.button
                        onClick={() => handleDeleteItemFromCart(item.id)}
                        className="text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2Icon size={18} />
                      </motion.button>
                    </motion.td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </motion.table>

          {/* Order Summary */}
          <motion.div
            key={totalPrice} // re-animate when total changes
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: { type: "spring", stiffness: 220, damping: 18 },
            }}
          >
            <OrderSummary totalPrice={totalPrice} items={cartArray} />
            <motion.p
              className="mt-2 text-right text-slate-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Payable: <motion.span layout>{formattedTotal}</motion.span>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  ) : (
    <motion.div
      className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.h1
        className="text-2xl sm:text-4xl font-semibold"
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 18 } }}
      >
        Your cart is empty
      </motion.h1>
    </motion.div>
  );
}
