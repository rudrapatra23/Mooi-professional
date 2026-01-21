'use client'
import { addAddress } from "@/lib/features/address/addressSlice"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"

const AddressModal = ({ setShowAddressModal }) => {

    const { getToken } = useAuth()
    const dispatch = useDispatch()

    const [address, setAddress] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: ''
    })

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/address', { address }, { headers: { Authorization: `Bearer ${token}` } })
            dispatch(addAddress(data.newAddress))
            toast.success(data.message)
            setShowAddressModal(false)
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || error.message)
        }
    }

    return (
        <form onSubmit={e => toast.promise(handleSubmit(e), { loading: 'Adding Address...' })} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm h-screen flex items-center justify-center p-6">
            <div className="bg-white border text-black w-full max-w-md p-8 relative shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                <button type="button" className="absolute top-4 right-4 text-black hover:rotate-90 transition-transform" onClick={() => setShowAddressModal(false)}>
                    <XIcon size={24} />
                </button>

                <h2 className="text-2xl font-serif font-bold uppercase tracking-widest mb-8 border-b border-black/10 pb-4">New Address</h2>

                <div className="flex flex-col gap-5">
                    <input name="name" onChange={handleAddressChange} value={address.name} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none" type="text" placeholder="FULL NAME" required />

                    <input name="email" onChange={handleAddressChange} value={address.email} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none" type="email" placeholder="EMAIL ADDRESS" required />

                    <input name="street" onChange={handleAddressChange} value={address.street} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none" type="text" placeholder="STREET ADDRESS" required />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <input name="city" onChange={handleAddressChange} value={address.city} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none" type="text" placeholder="CITY" required />
                        <input name="state" onChange={handleAddressChange} value={address.state} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none" type="text" placeholder="STATE" required />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <input name="zip" onChange={handleAddressChange} value={address.zip} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none" type="number" placeholder="ZIP CODE" required />
                        <input name="country" onChange={handleAddressChange} value={address.country} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none" type="text" placeholder="COUNTRY" required />
                    </div>

                    <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-3 outline-none border-b border-gray-300 focus:border-black transition-colors w-full text-sm font-medium placeholder-gray-400 uppercase tracking-wide bg-transparent rounded-none mb-4" type="tel" placeholder="PHONE NUMBER" required />

                    <button className="bg-black text-white py-4 w-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 transition-colors rounded-none">
                        SAVE ADDRESS
                    </button>
                </div>
            </div>
        </form>
    )
}

export default AddressModal