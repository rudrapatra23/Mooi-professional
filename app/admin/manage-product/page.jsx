'use client'

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Link from "next/link"

export default function ManageProductsPage() {
  const [products, setProducts] = useState(null) // null = not loaded yet
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)
  const { getToken, isLoaded } = useAuth()

  useEffect(() => setMounted(true), [])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError("Not authenticated — please sign in")
        setProducts([])
        return
      }
      const { data } = await axios.get("/api/store/product", {
        headers: { Authorization: `Bearer ${token}` }
      })
      // API ideally returns array or { products: [] }; handle both
      const list = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : [])
      setProducts(list)
    } catch (err) {
      console.error("fetchProducts error:", err)
      const msg = err?.response?.data?.error || err.message || "Failed to load products"
      setError(msg)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // wait until Clerk client is ready
    if (!isLoaded) return
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return

    // optimistic UI
    const before = products
    setProducts(prev => prev.filter(p => p.id !== id))

    try {
      const token = await getToken()
      await axios.delete(`/api/store/product?productId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Product deleted")
    } catch (err) {
      console.error("delete product error:", err)
      toast.error(err?.response?.data?.error || err.message || "Failed to delete")
      // rollback
      setProducts(before)
    }
  }

  const sortedProducts = Array.isArray(products)
    ? [...products].sort((a, b) => {
        // sort by createdAt desc, fallback to id
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
    : []

  if (loading) return <Loading />

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Manage Products</h1>
        <Link href="/admin/add-product" className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Add Product</Link>
      </div>

      {error && (
        <div className="mb-4 text-red-600">
          Error: {error}
          <button onClick={fetchProducts} className="ml-4 text-sm underline">Retry</button>
        </div>
      )}

      {!Array.isArray(products) || products.length === 0 ? (
        <div className="rounded-md p-6 border border-gray-200 text-center">
          {products === null ? "Loading…" : "No products found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedProducts.map(p => (
            <div key={p.id} className="flex items-center gap-4 p-4 border rounded shadow-sm">
              <img src={p.images?.[0] || "/placeholder.png"} alt={p.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">{p.name}</h2>
                  <div className="text-sm text-gray-500">{mounted ? new Date(p.createdAt).toLocaleString() : new Date(p.createdAt).toISOString()}</div>
                </div>
                <p className="text-sm text-gray-600">{p.category} • ₹{p.price}</p>
                <p className="text-xs text-gray-500 mt-1">{p.inStock ? "In stock" : "Out of stock"}</p>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <Link href={`/admin/edit-product/${p.id}`} className="px-3 py-1 bg-yellow-200 rounded text-sm">Edit</Link>
                <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
