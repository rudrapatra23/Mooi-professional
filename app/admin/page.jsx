'use client'
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, TagsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminDashboard() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    products: 0,
    revenue: 0,
    orders: 0,
  })

  const dashboardCardsData = [
    { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
    { title: 'Total Revenue', value: currency + Number(dashboardData.revenue || 0).toLocaleString(), icon: CircleDollarSignIcon },
    { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
  ]

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // try using a Clerk token (your server's getAuth might accept it)
      const token = await getToken().catch(() => null)

      const axiosConfig = {
        headers: {},
        // If your server uses cookie-based Clerk sessions, uncomment the next line:
        // withCredentials: true
      }
      if (token) axiosConfig.headers.Authorization = `Bearer ${token}`

      const { data } = await axios.get('/api/admin/dashboard', axiosConfig)

      // API returns top-level: { ordersCount, productsCount, revenue }
      // map that to the shape the UI expects
      setDashboardData({
        products: data.productsCount ?? data.products ?? 0,
        revenue: data.revenue ?? 0,
        orders: data.ordersCount ?? data.orders ?? 0,
      })
    } catch (error) {
      console.error("fetchDashboardData error:", error)
      const msg = error?.response?.data?.error || error.message || "Failed to load dashboard"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) return <Loading />

  return (
    <div className="text-slate-500">
      <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

      {/* Cards */}
      <div className="flex flex-wrap gap-5 my-10 mt-4">
        {dashboardCardsData.map((card, index) => (
          <div key={index} className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg">
            <div className="flex flex-col gap-3 text-xs">
              <p>{card.title}</p>
              <b className="text-2xl font-medium text-slate-700">{card.value}</b>
            </div>
            <card.icon size={50} className=" w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>

      {/* Area Chart (you can pass real orders if you fetch them separately) */}
      <OrdersAreaChart allOrders={[]} />
    </div>
  )
}
