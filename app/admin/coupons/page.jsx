'use client'
import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { DeleteIcon, ToggleLeft, ToggleRight } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

export default function AdminCoupons() {
    const { getToken } = useAuth()
    const [coupons, setCoupons] = useState([])

    const [newCoupon, setNewCoupon] = useState({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        maxDiscount: '',
        minOrderValue: '',
        usageLimit: '',
        expiresAt: '',
        startsAt: '',
        isActive: true,
    })

    const fetchCoupons = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/coupon', {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log("COUPONS_API", data)
            const list = Array.isArray(data?.coupons) ? data.coupons : []
            setCoupons(list)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleAddCoupon = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()

            // Prepare coupon data
            const couponData = {
                code: newCoupon.code.trim().toUpperCase(),
                description: newCoupon.description.trim(),
                discountType: newCoupon.discountType,
                discountValue: Number(newCoupon.discountValue),
                maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : null,
                minOrderValue: newCoupon.minOrderValue ? Number(newCoupon.minOrderValue) : null,
                usageLimit: newCoupon.usageLimit ? Number(newCoupon.usageLimit) : null,
                expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt) : null,
                startsAt: newCoupon.startsAt ? new Date(newCoupon.startsAt) : null,
                isActive: newCoupon.isActive,
                usedCount: 0,
            }

            // Validation
            if (!couponData.code) {
                toast.error('Coupon code is required')
                return
            }
            if (couponData.discountValue <= 0) {
                toast.error('Discount value must be greater than 0')
                return
            }
            if (couponData.discountType === 'PERCENTAGE' && couponData.discountValue > 100) {
                toast.error('Percentage discount cannot exceed 100%')
                return
            }

            const { data } = await axios.post('/api/admin/coupon', 
                { coupon: couponData }, 
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            toast.success(data.message || 'Coupon added successfully')
            
            // Reset form
            setNewCoupon({
                code: '',
                description: '',
                discountType: 'PERCENTAGE',
                discountValue: '',
                maxDiscount: '',
                minOrderValue: '',
                usageLimit: '',
                expiresAt: '',
                startsAt: '',
                isActive: true,
            })
            
            await fetchCoupons()
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setNewCoupon({ 
            ...newCoupon, 
            [name]: type === 'checkbox' ? checked : value 
        })
    }

    const toggleCouponStatus = async (code, currentStatus) => {
        try {
            const token = await getToken()
            await axios.patch(`/api/admin/coupon`, 
                { code, isActive: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            await fetchCoupons()
            toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const deleteCoupon = async (code) => {
        try {
            const confirm = window.confirm("Are you sure you want to delete this coupon?")
            if (!confirm) return
            
            const token = await getToken()
            await axios.delete(`/api/admin/coupon?code=${code}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            await fetchCoupons()
            toast.success("Coupon deleted successfully")
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        fetchCoupons()
    }, [])

    return (
        <div className="text-slate-500 mb-40">
            {/* Add Coupon */}
            <form onSubmit={(e) => toast.promise(handleAddCoupon(e), { loading: "Adding coupon..." })} 
                  className="max-w-2xl text-sm">
                <h2 className="text-2xl mb-4">Add <span className="text-slate-800 font-medium">Coupon</span></h2>
                
                {/* Code and Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Coupon Code *</label>
                        <input 
                            type="text" 
                            placeholder="SAVE20" 
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md uppercase"
                            name="code" 
                            value={newCoupon.code} 
                            onChange={handleChange} 
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Description *</label>
                        <input 
                            type="text" 
                            placeholder="20% off on all products" 
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                            name="description" 
                            value={newCoupon.description} 
                            onChange={handleChange} 
                            required
                        />
                    </div>
                </div>

                {/* Discount Type and Value */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Discount Type *</label>
                        <select 
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                            name="discountType" 
                            value={newCoupon.discountType} 
                            onChange={handleChange}
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (₹)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Discount Value * {newCoupon.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                        </label>
                        <input 
                            type="number" 
                            placeholder={newCoupon.discountType === 'PERCENTAGE' ? '20' : '200'}
                            min="0.01"
                            step="0.01"
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                            name="discountValue" 
                            value={newCoupon.discountValue} 
                            onChange={handleChange} 
                            required
                        />
                    </div>

                    {newCoupon.discountType === 'PERCENTAGE' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Max Discount (₹)</label>
                            <input 
                                type="number" 
                                placeholder="500"
                                min="0"
                                step="0.01"
                                className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                                name="maxDiscount" 
                                value={newCoupon.maxDiscount} 
                                onChange={handleChange}
                            />
                        </div>
                    )}
                </div>

                {/* Min Order Value and Usage Limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Min Order Value (₹)</label>
                        <input 
                            type="number" 
                            placeholder="1000"
                            min="0"
                            step="0.01"
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                            name="minOrderValue" 
                            value={newCoupon.minOrderValue} 
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Usage Limit</label>
                        <input 
                            type="number" 
                            placeholder="100"
                            min="1"
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                            name="usageLimit" 
                            value={newCoupon.usageLimit} 
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Start and Expiry Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <input 
                            type="datetime-local"
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                            name="startsAt" 
                            value={newCoupon.startsAt} 
                            onChange={handleChange}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Expiry Date</label>
                        <input 
                            type="datetime-local"
                            className="w-full p-2 border border-slate-200 outline-slate-400 rounded-md"
                            name="expiresAt" 
                            value={newCoupon.expiresAt} 
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Active Toggle */}
                <div className="mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            name="isActive" 
                            checked={newCoupon.isActive}
                            onChange={handleChange}
                        />
                        <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200 relative">
                            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                        </div>
                        <span className="text-sm font-medium">Active Coupon</span>
                    </label>
                </div>

                <button className="mt-6 py-2 px-10 rounded bg-slate-700 text-white hover:bg-slate-900 active:scale-95 transition">
                    Add Coupon
                </button>
            </form>

            {/* List Coupons */}
            <div className="mt-14">
                <h2 className="text-2xl mb-4">Manage <span className="text-slate-800 font-medium">Coupons</span></h2>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full bg-white text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Code</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Description</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Discount</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Min Order</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Usage</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Expires</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Status</th>
                                <th className="py-3 px-4 text-left font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {Array.isArray(coupons) && coupons.map((coupon) => (
                                <tr key={coupon.code} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 font-medium text-slate-800">{coupon.code}</td>
                                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{coupon.description}</td>
                                    <td className="py-3 px-4 text-slate-800">
                                        {coupon.discountType === 'PERCENTAGE' 
                                            ? `${coupon.discountValue}%${coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ''}`
                                            : `₹${coupon.discountValue}`
                                        }
                                    </td>
                                    <td className="py-3 px-4 text-slate-800">
                                        {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-slate-800">
                                        {coupon.usedCount || 0}
                                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                                    </td>
                                    <td className="py-3 px-4 text-slate-800">
                                        {coupon.expiresAt 
                                            ? format(new Date(coupon.expiresAt), 'MMM dd, yyyy')
                                            : 'No expiry'
                                        }
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => toggleCouponStatus(coupon.code, coupon.isActive)}
                                            className="flex items-center gap-1"
                                        >
                                            {coupon.isActive ? (
                                                <>
                                                    <ToggleRight className="w-6 h-6 text-green-600" />
                                                    <span className="text-green-600 text-xs font-medium">Active</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                                                    <span className="text-slate-400 text-xs font-medium">Inactive</span>
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4">
                                        <DeleteIcon 
                                            onClick={() => toast.promise(
                                                deleteCoupon(coupon.code), 
                                                { loading: "Deleting coupon..." }
                                            )} 
                                            className="w-5 h-5 text-red-500 hover:text-red-700 cursor-pointer transition" 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {coupons.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                            No coupons found. Add your first coupon above.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}