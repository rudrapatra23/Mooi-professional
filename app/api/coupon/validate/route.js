// app/api/coupon/validate/route.js
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        
        if (!userId) {
            return NextResponse.json(
                { ok: false, error: "Please login to apply coupons" },
                { status: 401 }
            );
        }

        const { code, subtotal } = await request.json();

        if (!code) {
            return NextResponse.json(
                { ok: false, error: "Coupon code is required" },
                { status: 400 }
            );
        }

        if (!subtotal || subtotal <= 0) {
            return NextResponse.json(
                { ok: false, error: "Invalid order subtotal" },
                { status: 400 }
            );
        }

        // Find coupon
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase().trim() }
        });

        if (!coupon) {
            return NextResponse.json(
                { ok: false, error: "Invalid coupon code" },
                { status: 400 }
            );
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return NextResponse.json(
                { ok: false, error: "This coupon is no longer active" },
                { status: 400 }
            );
        }

        // Check dates
        const now = new Date();

        if (coupon.startsAt && new Date(coupon.startsAt) > now) {
            return NextResponse.json(
                { ok: false, error: "This coupon is not yet valid" },
                { status: 400 }
            );
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
            return NextResponse.json(
                { ok: false, error: "This coupon has expired" },
                { status: 400 }
            );
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json(
                { ok: false, error: "This coupon has reached its usage limit" },
                { status: 400 }
            );
        }

        // Check minimum order value
        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
            return NextResponse.json(
                { 
                    ok: false, 
                    error: `Minimum order value of ₹${coupon.minOrderValue} required` 
                },
                { status: 400 }
            );
        }

        // Calculate discount preview
        let discountAmount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscount);
            }
        } else if (coupon.discountType === 'FIXED') {
            discountAmount = Math.min(coupon.discountValue, subtotal);
        }

        discountAmount = parseFloat(discountAmount.toFixed(2));

        // Return coupon details for frontend
        return NextResponse.json({
            ok: true,
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount,
                discountAmount, // calculated discount for this order
            }
        });

    } catch (error) {
        console.error("[POST /api/coupon/validate]", error);
        return NextResponse.json(
            { ok: false, error: "Failed to validate coupon" },
            { status: 500 }
        );
    }
}

