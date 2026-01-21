'use client'
import { addToCart, removeFromCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

const Counter = ({ productId }) => {

    const { cartItems } = useSelector(state => state.cart);
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const syncTimeoutRef = useRef(null);

    // Sync cart to server with debounce
    const syncCart = () => {
        // Clear any pending sync
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }
        // Debounce: wait 500ms before syncing to avoid spam
        syncTimeoutRef.current = setTimeout(() => {
            dispatch(uploadCart({ getToken }));
        }, 500);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, []);

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }));
        syncCart();
    }

    const removeFromCartHandler = () => {
        dispatch(removeFromCart({ productId }));
        syncCart();
    }

    return (
        <div className="inline-flex items-center">
            <button
                onClick={removeFromCartHandler}
                className="w-8 h-8 flex items-center justify-center text-lg font-bold select-none hover:bg-gray-100 transition-colors"
            >
                −
            </button>
            <span className="w-10 h-8 flex items-center justify-center text-sm font-bold">
                {cartItems[productId] || 0}
            </span>
            <button
                onClick={addToCartHandler}
                className="w-8 h-8 flex items-center justify-center text-lg font-bold select-none hover:bg-gray-100 transition-colors"
            >
                +
            </button>
        </div>
    )
}

export default Counter