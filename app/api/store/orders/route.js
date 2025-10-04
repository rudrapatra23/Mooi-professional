import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/store/orders
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { storeId: process.env.STORE_ID },
      include: {
        user: true,
        address: true,
        orderItems: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/store/orders error:", error);
    return NextResponse.json(
      { error: String(error?.message || error) },
      { status: 500 }
    );
  }
}
