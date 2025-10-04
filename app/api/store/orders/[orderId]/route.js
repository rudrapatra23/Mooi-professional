// app/api/store/orders/[orderId]/route.js
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req, context) {
  try {
    const { orderId } = await context.params; // ✅ await params

    if (!orderId) {
      return NextResponse.json({ error: "orderId param is required" }, { status: 400 });
    }

    const { status, paymentStatus, trackingId } = await req.json();

    if (!status && !paymentStatus && !trackingId) {
      return NextResponse.json(
        { error: "Provide at least one of: status, paymentStatus, trackingId" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId, storeId: process.env.STORE_ID },
      data: {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(trackingId ? { trackingId } : {}),
      },
    });

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    console.error("PATCH /api/store/orders/[orderId] error:", error);
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}
