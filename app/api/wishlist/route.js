
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper: Delete expired items (older than 60 days)
async function cleanExpiredItems(userId) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    await prisma.wishlist.deleteMany({
        where: {
            userId,
            createdAt: { lt: sixtyDaysAgo },
        },
    });
}

// GET: Fetch user's wishlist
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Lazy cleanup on read
        await cleanExpiredItems(userId);

        const wishlist = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        mrp: true,
                        images: true,
                        inStock: true,
                        stock: true,
                        category: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ items: wishlist });
    } catch (error) {
        console.error('Wishlist GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Toggle item (Add if not exists, Remove if exists)
export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await req.json();
        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        // Check if exists
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (existing) {
            // Remove
            await prisma.wishlist.delete({
                where: { id: existing.id },
            });
            return NextResponse.json({ message: 'Removed from wishlist', action: 'removed' });
        } else {
            // Add
            await prisma.wishlist.create({
                data: {
                    userId,
                    productId,
                },
            });
            return NextResponse.json({ message: 'Added to wishlist', action: 'added' });
        }
    } catch (error) {
        console.error('Wishlist POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
