
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

export const fetchWishlist = createAsyncThunk(
    'wishlist/fetchWishlist',
    async ({ getToken }, { rejectWithValue }) => {
        try {
            const token = await getToken();
            if (!token) return [];
            const { data } = await axios.get('/api/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return data.items || [];
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch wishlist');
        }
    }
);

export const toggleWishlist = createAsyncThunk(
    'wishlist/toggle',
    async ({ productId, getToken }, { dispatch, rejectWithValue }) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Please login to use wishlist');
                return null;
            }

            // Optimistic update logic could go here, but for now we wait for server
            const { data } = await axios.post('/api/wishlist',
                { productId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.action === 'added') toast.success('Added to Favorites');
            if (data.action === 'removed') toast.success('Removed from Favorites');

            // Refresh list
            dispatch(fetchWishlist({ getToken }));
            return data;
        } catch (error) {
            toast.error('Failed to update wishlist');
            return rejectWithValue(error.response?.data);
        }
    }
);

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWishlist.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default wishlistSlice.reducer;
