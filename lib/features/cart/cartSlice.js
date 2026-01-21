// lib/features/cart/cartSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

// Helper to convert object map {id: qty} to array [{productId, quantity}]
const toArray = (itemsObj) => Object.entries(itemsObj).map(([pid, qty]) => ({ productId: pid, quantity: qty }));

export const uploadCart = createAsyncThunk('cart/uploadCart',
    async ({ getToken }, { getState, rejectWithValue }) => {
        try {
            const { cartItems } = getState().cart;
            const token = await getToken();
            if (!token) return;

            const itemsPayload = toArray(cartItems);
            await axios.post('/api/cart/sync', { items: itemsPayload }, { headers: { Authorization: `Bearer ${token}` } })
            return { success: true }
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message)
        }
    }
)

export const fetchCart = createAsyncThunk('cart/fetchCart',
    async ({ getToken }, { rejectWithValue }) => {
        try {
            const token = await getToken()
            if (!token) return { cartItems: {} }; // Guest mode
            const { data } = await axios.get('/api/cart/sync', { headers: { Authorization: `Bearer ${token}` } })
            return data // { cartItems: { id: qty }, items: [...] }
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch cart')
        }
    }
)

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {}, // { productId: quantity }
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            state.cartItems[productId] = (state.cartItems[productId] || 0) + 1
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] <= 0) {
                    delete state.cartItems[productId]
                }
                state.total -= 1
            }
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.total -= state.cartItems[productId]
                delete state.cartItems[productId]
            }
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            // Merge or Replace? Strategy: DB is truth on load
            const remoteMap = action.payload.cartItems || {};
            state.cartItems = remoteMap;
            state.total = Object.values(remoteMap).reduce((acc, qty) => acc + qty, 0);
        })
    }
})

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions
export default cartSlice.reducer
