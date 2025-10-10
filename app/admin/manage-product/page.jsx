'use client'

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import Link from "next/link"

export default function ManageProductsPage() {
  const [products, setProducts] = useState(null) // items for the current page
  const [total, setTotal] = useState(null) // total count from API
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50) // set to large number if you want all items at once
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)
  const { getToken, isLoaded } = useAuth()

  useEffect(() => setMounted(true), [])

  const fetchProducts = async ({ pageArg = page, limitArg = limit } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError("Not authenticated — please sign in")
        setProducts([])
        setTotal(0)
        setLoading(false)
        return
      }

      // request the server's canonical list endpoint; include pagination and cache-bust
      const { data } = await axios.get(`/api/products?page=${pageArg}&limit=${limitArg}&ts=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      })

      // server should return { total, page, limit, items }
      const items = Array.isArray(data?.items) ? data.items
                   : (Array.isArray(data?.products) ? data.products : [])
      const tot = Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length

      setProducts(items)
      setTotal(tot)
    } catch (err) {
      console.error("fetchProducts error:", err)
      const msg = err?.response?.data?.error || err.message || "Failed to load products"
      setError(msg)
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, page, limit])

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return

    // optimistic UI: remove from current page and decrement total
    const beforeProducts = products
    const beforeTotal = total
    setProducts(prev => Array.isArray(prev) ? prev.filter(p => p.id !== id) : prev)
    setTotal(prev => (typeof prev === "number" ? Math.max(0, prev - 1) : prev))

    try {
      const token = await getToken()
      await axios.delete(`/api/product?productId=${encodeURIComponent(id)}&ts=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" }
      })
      toast.success("Product deleted")
      // if after deletion the page has no items but total>0, try to refetch current page
      if ((!products || products.length === 1) && (beforeTotal > 1)) {
        // re-fetch to get next page item(s)
        fetchProducts()
      }
    } catch (err) {
      console.error("delete product error:", err)
      toast.error(err?.response?.data?.error || err.message || "Failed to delete")
      // rollback
      setProducts(beforeProducts)
      setTotal(beforeTotal)
    }
  }

  // show the current page items sorted by createdAt desc
  const sortedProducts = Array.isArray(products)
    ? [...products].sort((a, b) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : -Infinity
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : -Infinity
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

      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total Products: <span className="font-medium">{total ?? "—"}</span>
          <span className="ml-4 text-xs text-gray-400">Showing page {page} • {Array.isArray(products) ? products.length : 0} items</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Per page</label>
          <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="border rounded p-1">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={200}>All (200)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600">
          Error: {error}
          <button onClick={() => fetchProducts({ pageArg: 1, limitArg: limit })} className="ml-4 text-sm underline">Retry</button>
        </div>
      )}

      {!Array.isArray(products) || products.length === 0 ? (
        <div className="rounded-md p-6 border border-gray-200 text-center">
          {products === null ? "Loading…" : "No products on this page."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedProducts.map(p => (
            <div key={p.id} className="flex items-center gap-4 p-4 border rounded shadow-sm">
              <img src={p.images?.[0] || "/placeholder.png"} alt={p.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">{p.name}</h2>
                  <div className="text-sm text-gray-500">
                    {mounted
                      ? (p.createdAt ? new Date(p.createdAt).toLocaleString() : "—")
                      : (p.createdAt ? new Date(p.createdAt).toISOString() : "—")
                    }
                  </div>
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

      {/* simple pagination controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {page}</div>
        <div className="flex gap-2 items-center">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={(total !== null && page * limit >= total)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}
