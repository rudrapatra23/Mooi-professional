'use client'
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, TagsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminDashboard() {
  const { getToken, userId } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    products: 0,
    revenue: 0,
    orders: 0,
  })
  const [allOrders, setAllOrders] = useState([])
  const [unauthorized, setUnauthorized] = useState(false)

  // helpful console message for .env setup
  useEffect(() => {
    if (userId) {
      console.log(
        `%c[Clerk] Your current Clerk userId: ${userId}`,
        "color: #22c55e; font-weight: bold;"
      )
      console.log(
        "👉 Add this in .env.local if needed:\nADMIN_USER_IDS=" + userId
      )
    }
  }, [userId])

  const dashboardCardsData = [
    { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
    { title: 'Total Revenue', value: currency + Number(dashboardData.revenue || 0).toLocaleString(), icon: CircleDollarSignIcon },
    { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
  ]

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = await getToken().catch(() => null)

      const axiosConfig = { headers: {} }
      if (token) axiosConfig.headers.Authorization = `Bearer ${token}`
      // If your environment uses cookie-session for Clerk, you may instead use withCredentials: true

      const { data } = await axios.get('/api/admin/dashboard', axiosConfig)

      // handle unauthorized
      if (data?.error === 'Unauthorized') {
        setUnauthorized(true)
        toast.error("You are not authorized to access this dashboard.")
        return
      }

      // map top-level keys into our UI shape
      setDashboardData({
        products: data.productsCount ?? data.products ?? 0,
        revenue: data.revenue ?? 0,
        orders: data.ordersCount ?? data.orders ?? 0,
      })

      // If API provided allOrders, normalize timestamps and sort
      const rawOrders = Array.isArray(data.allOrders) ? data.allOrders : []
      const normalized = rawOrders
        .map((o) => {
          // ensure createdAt is a string ISO timestamp (frontend chart libs like strings)
          const createdAt = o.createdAt ? new Date(o.createdAt).toISOString() : null
          return { ...o, createdAt }
        })
        .filter(o => o.createdAt && typeof o.total === 'number') 
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

      setAllOrders(normalized)
    } catch (error) {
      console.error("fetchDashboardData error:", error)
      const msg = error?.response?.data?.error || error.message || "Failed to load dashboard"
      toast.error(msg)
      if (error?.response?.status === 401) setUnauthorized(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) return <Loading />

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-slate-500">
        <h1 className="text-3xl font-semibold text-slate-700 mb-3">Access Denied</h1>
        <p className="text-slate-500 max-w-md">
          You are not authorized to view this page.
          Add your email or Clerk userId to <code>.env.local</code> under <b>ADMIN_EMAILS</b> or <b>ADMIN_USER_IDS</b>, then restart the server.
        </p>
      </div>
    )
  }

  return (
    <div className="text-slate-500">
      <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

      {/* Cards */}
      <div className="flex flex-wrap gap-5 my-10 mt-4">
        {dashboardCardsData.map((card, index) => (
          <div
            key={index}
            className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg shadow-sm hover:shadow-md transition"
          >
            <div className="flex flex-col gap-3 text-xs">
              <p>{card.title}</p>
              <b className="text-2xl font-medium text-slate-700">{card.value}</b>
            </div>
            <card.icon
              size={50}
              className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full"
            />
          </div>
        ))}
      </div>

      
      <OrdersAreaChart allOrders={allOrders} />
    </div>
  )
}
