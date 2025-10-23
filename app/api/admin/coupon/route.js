// app/api/admin/coupon/route.js
import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Add new coupon
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "not_authorized" }, { status: 401 });
        }

        const { coupon } = await request.json();

        // Validate required fields
        if (!coupon.code || !coupon.discountType || !coupon.discountValue) {
            return NextResponse.json(
                { error: "Missing required fields: code, discountType, discountValue" },
                { status: 400 }
            );
        }

        // Normalize and validate
        const normalizedCoupon = {
            code: coupon.code.toUpperCase().trim(),
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
            minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
            usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : null,
            usedCount: 0,
            isActive: coupon.isActive ?? true,
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
            startsAt: coupon.startsAt ? new Date(coupon.startsAt) : null,
        };

        // Validation checks
        if (!['PERCENTAGE', 'FIXED'].includes(normalizedCoupon.discountType)) {
            return NextResponse.json(
                { error: "discountType must be either PERCENTAGE or FIXED" },
                { status: 400 }
            );
        }

        if (normalizedCoupon.discountValue <= 0) {
            return NextResponse.json(
                { error: "discountValue must be greater than 0" },
                { status: 400 }
            );
        }

        if (normalizedCoupon.discountType === 'PERCENTAGE' && normalizedCoupon.discountValue > 100) {
            return NextResponse.json(
                { error: "Percentage discount cannot exceed 100%" },
                { status: 400 }
            );
        }

        // Check if coupon code already exists
        const existing = await prisma.coupon.findUnique({
            where: { code: normalizedCoupon.code }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Coupon code already exists" },
                { status: 400 }
            );
        }

        // Create coupon
        const createdCoupon = await prisma.coupon.create({
            data: normalizedCoupon
        });

        // Schedule expiry event if expiry date is set
        if (createdCoupon.expiresAt) {
            try {
                await inngest.send({
                    name: "app/coupon.expired",
                    data: {
                        code: createdCoupon.code,
                        expires_at: createdCoupon.expiresAt,
                    }
                });
            } catch (inngestError) {
                console.error("Inngest scheduling error:", inngestError);
                // Don't fail the request if Inngest fails
            }
        }

        return NextResponse.json({ 
            message: "Coupon added successfully",
            coupon: createdCoupon 
        });

    } catch (error) {
        console.error("[POST /api/admin/coupon]", error);
        return NextResponse.json({ 
            error: error.code || error.message 
        }, { status: 400 });
    }
}

// Update coupon status
export async function PATCH(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "not_authorized" }, { status: 401 });
        }

        const { code, isActive } = await request.json();

        if (!code) {
            return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
        }

        const updatedCoupon = await prisma.coupon.update({
            where: { code: code.toUpperCase() },
            data: { isActive: Boolean(isActive) }
        });

        return NextResponse.json({ 
            message: `Coupon ${isActive ? 'activated' : 'deactivated'} successfully`,
            coupon: updatedCoupon 
        });

    } catch (error) {
        console.error("[PATCH /api/admin/coupon]", error);
        return NextResponse.json({ 
            error: error.code || error.message 
        }, { status: 400 });
    }
}

// Delete coupon
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "not_authorized" }, { status: 401 });
        }

        const { searchParams } = request.nextUrl;
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
        }

        await prisma.coupon.delete({
            where: { code: code.toUpperCase() }
        });

        return NextResponse.json({ message: 'Coupon deleted successfully' });

    } catch (error) {
        console.error("[DELETE /api/admin/coupon]", error);
        
        // Handle case where coupon doesn't exist
        if (error.code === 'P2025') {
            return NextResponse.json({ 
                error: "Coupon not found" 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            error: error.code || error.message 
        }, { status: 400 });
    }
}

// Get all coupons
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json({ error: "not_authorized" }, { status: 401 });
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ coupons });

    } catch (error) {
        console.error("[GET /api/admin/coupon]", error);
        return NextResponse.json({ 
            error: error.code || error.message 
        }, { status: 400 });
    }
}