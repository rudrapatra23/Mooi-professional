// app/api/admin/dashboard/route.js
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "not authorized" }, { status: 401 });

    // only count COD and RAZORPAY (for RAZORPAY we require isPaid true)
    const paidWhere = {
      OR: [
        { paymentMethod: "COD" },
        { AND: [{ paymentMethod: "RAZORPAY" }, { isPaid: true }] }
      ]
    };

    const [ordersCount, productsCount, revenueAgg] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({ where: paidWhere, _sum: { total: true } })
    ]);

    const revenue = revenueAgg._sum?.total ?? 0;

    return NextResponse.json({
      dashboardData: {
        orders: ordersCount,
        products: productsCount,
        revenue: Number(revenue).toFixed(2)
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    // if Prisma complains about enum, it will indicate that in error message
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 400 });
  }
}
