'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { Package } from "lucide-react";
import Link from "next/link";

export default function Orders() {

    const { getToken } = useAuth()
    const { user, isLoaded } = useUser()
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true)

    const router = useRouter()

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
                console.log("ORDERS_API", data);
                const list = data?.items ?? data?.orders ?? [];
                setOrders(list)
                setLoading(false)
            } catch (error) {
                toast.error(error?.response?.data?.error || error.message)
            }
        }
        if (isLoaded) {
            if (user) {
                fetchOrders()
            } else {
                router.push('/')
            }
        }
    }, [isLoaded, user, getToken, router]);

    if (!isLoaded || loading) {
        return <Loading />
    }

    return (
        <div className="min-h-[70vh]">
            {Array.isArray(orders) && orders.length > 0 ? (
                <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-6">
                    {/* Header */}
                    <div className="mb-12 border-b border-black pb-6">
                        <span className="text-xs font-bold tracking-[0.3em] text-gray-400 uppercase">
                            Your Account
                        </span>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-tight mt-2">
                            My Orders
                        </h1>
                        <p className="text-gray-500 mt-2">
                            {orders.length} order{orders.length !== 1 ? 's' : ''} placed
                        </p>
                    </div>

                    <table className="w-full max-w-5xl text-gray-700 table-auto border-separate border-spacing-y-8">
                        <thead>
                            <tr className="text-xs font-bold uppercase tracking-widest text-black max-md:hidden">
                                <th className="text-left pb-4 border-b border-black">Product</th>
                                <th className="text-center pb-4 border-b border-black">Total</th>
                                <th className="text-left pb-4 border-b border-black">Shipping Address</th>
                                <th className="text-left pb-4 border-b border-black">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <OrderItem order={order} key={order.id} />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4">
                    <Package size={64} className="text-gray-200" />
                    <div className="text-center">
                        <h1 className="text-2xl font-serif font-bold uppercase tracking-widest mb-2">No Orders Yet</h1>
                        <p className="text-gray-500 mb-6">Start shopping to see your orders here.</p>
                        <Link href="/shop" className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors">
                            Shop Now
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}