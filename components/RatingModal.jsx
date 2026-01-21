'use client'

import { Star, XIcon } from 'lucide-react';
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/nextjs';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { addRating } from '@/lib/features/rating/ratingSlice';

const RatingModal = ({ ratingModal, setRatingModal }) => {

    const { getToken } = useAuth()
    const dispatch = useDispatch()

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');

    const handleSubmit = async () => {
        if (rating < 0 || rating > 5) {
            return toast('Please select a rating');
        }
        if (review.length < 5) {
            return toast('Write a short review');
        }
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/rating', { productId: ratingModal.productId, orderId: ratingModal.orderId, rating, review }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            dispatch(addRating(data.rating))
            toast.success(data.message)
            setRatingModal(null);
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }

    }

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
            <div className='bg-white p-8 w-full max-w-md relative border border-black shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300'>
                <button
                    onClick={() => setRatingModal(null)}
                    className='absolute top-4 right-4 text-black hover:rotate-90 transition-transform'
                >
                    <XIcon size={24} />
                </button>

                <h2 className='text-2xl font-serif font-bold uppercase tracking-widest mb-8 border-b border-black/10 pb-4'>
                    Rate Product
                </h2>

                <div className='flex items-center justify-center gap-2 mb-6'>
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className={`size-10 cursor-pointer transition-all hover:scale-110 ${rating > i ? "text-black fill-current" : "text-gray-300"}`}
                            onClick={() => setRating(i + 1)}
                        />
                    ))}
                </div>

                <textarea
                    className='w-full p-4 border border-gray-300 focus:border-black transition-colors mb-6 focus:outline-none text-sm resize-none'
                    placeholder='Write your review (min 5 characters)...'
                    rows='4'
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                />

                <button
                    onClick={e => toast.promise(handleSubmit(), { loading: 'Submitting...' })}
                    className='w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors'
                >
                    Submit Rating
                </button>
            </div>
        </div>
    )
}

export default RatingModal