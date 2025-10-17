import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { productId } = await params;
    console.log("✅ Ratings route hit for:", productId);

    const ratings = await prisma.rating.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true, email: true },
        },
      },
    });

    return NextResponse.json(ratings);
  } catch (error) {
    console.error("❌ Ratings API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
