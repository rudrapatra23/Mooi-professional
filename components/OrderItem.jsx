'use client'
import Image from "next/image";
import { useSelector } from "react-redux";
import Rating from "./Rating";
import { useState } from "react";
import RatingModal from "./RatingModal";

const OrderItem = ({ order }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const [ratingModal, setRatingModal] = useState(null);

    const { ratings } = useSelector(state => state.rating);

    // Status styling helper
    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'bg-black text-white';
            case 'confirmed':
            case 'processing':
                return 'bg-neutral-100 text-black border border-black';
            case 'cancelled':
                return 'bg-white text-black border border-black';
            default:
                return 'bg-neutral-100 text-black';
        }
    };

    return (
        <>
            <tr className="text-sm">
                <td className="text-left">
                    <div className="flex flex-col gap-6">
                        {order.orderItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-20 aspect-square border border-black flex items-center justify-center">
                                    <Image
                                        className="h-14 w-auto object-contain"
                                        src={item.product.images[0]}
                                        alt="product_img"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                                <div className="flex flex-col justify-center text-sm">
                                    <p className="font-bold text-black uppercase tracking-wide">{item.product.name}</p>
                                    <p className="text-gray-500 mt-1">{currency}{item.price} × {item.quantity}</p>
                                    <p className="text-gray-400 text-xs mt-1">{new Date(order.createdAt).toDateString()}</p>
                                    <div className="mt-2">
                                        {ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId)
                                            ? <Rating value={ratings.find(rating => order.id === rating.orderId && item.product.id === rating.productId).rating} />
                                            : <button 
                                                onClick={() => setRatingModal({ orderId: order.id, productId: item.product.id })} 
                                                className={`text-black text-xs font-bold uppercase tracking-widest hover:underline underline-offset-4 ${order.status !== "DELIVERED" && 'hidden'}`}
                                              >
                                                Rate Product
                                              </button>
                                        }
                                    </div>
                                    {ratingModal && <RatingModal ratingModal={ratingModal} setRatingModal={setRatingModal} />}
                                </div>
                            </div>
                        ))}
                    </div>
                </td>

                <td className="text-center max-md:hidden font-bold">{currency}{order.total}</td>

                <td className="text-left max-md:hidden text-gray-600 text-xs">
                    <p className="font-medium text-black">{order.address.name}</p>
                    <p>{order.address.street}</p>
                    <p>{order.address.city}, {order.address.state} {order.address.zip}</p>
                    <p>{order.address.country}</p>
                    <p className="mt-1">{order.address.phone}</p>
                </td>

                <td className="text-left space-y-2 text-sm max-md:hidden">
                    <div className={`inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                        {order.status.split('_').join(' ').toLowerCase()}
                    </div>
                </td>
            </tr>
            
            {/* Mobile View */}
            <tr className="md:hidden">
                <td colSpan={5}>
                    <div className="text-xs text-gray-600 mt-4">
                        <p className="font-medium text-black">{order.address.name}</p>
                        <p>{order.address.street}, {order.address.city}</p>
                        <p>{order.address.state} {order.address.zip}, {order.address.country}</p>
                        <p className="mt-1">{order.address.phone}</p>
                    </div>
                    <div className="flex items-center mt-4">
                        <span className={`text-center mx-auto px-6 py-2 text-xs font-bold uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                            {order.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                    </div>
                </td>
            </tr>
            
            <tr>
                <td colSpan={4}>
                    <div className="border-b border-black/20 w-full mt-6" />
                </td>
            </tr>
        </>
    )
}

export default OrderItem