'use client'
import { useUser, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import logo from '../../assets/logo.png'
const AdminNavbar = () => {

    const {user} = useUser()

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/admin" className="relative text-4xl font-semibold text-slate-700">
                <img src={logo.src} alt="Logo" className="w-32 h-auto"/>
                <p className="absolute text-xs font-semibold -top-1 -right-13 px-3 p-0.5 rounded-none flex items-center gap-2 text-white bg-black border border-white">
                    Admin
                </p>
            </Link>
            <div className="flex items-center gap-3">
                <p>Hi, {user?.firstName}</p>
                <UserButton />
            </div>
        </div>
    )
}

export default AdminNavbar