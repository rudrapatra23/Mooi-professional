
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper: Clean expired cart items
async function cleanExpiredCartItems(cartId) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Clean items older than 60 days
    await prisma.cartItem.deleteMany({
        where: {
            cartId,
            createdAt: { lt: sixtyDaysAgo },
        },
    });
}

// POST: Sync local cart with DB
// Body: { items: [{ productId, quantity }] }
export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { items: localItems } = await req.json();

        // 1. Get or Create Cart
        let cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            });
        }

        // 2. Cleanup expired items
        await cleanExpiredCartItems(cart.id);

        // 3. Process Local Items (Merge/Update/Delete)
        if (Array.isArray(localItems) && localItems.length > 0) {
            for (const item of localItems) {
                if (!item.productId) continue;

                const qty = typeof item.quantity === 'number' ? item.quantity : 0;

                if (qty <= 0) {
                    // Delete item if quantity is 0 or less
                    await prisma.cartItem.deleteMany({
                        where: {
                            cartId: cart.id,
                            productId: item.productId,
                        },
                    });
                } else {
                    // Upsert item
                    await prisma.cartItem.upsert({
                        where: {
                            cartId_productId: {
                                cartId: cart.id,
                                productId: item.productId,
                            },
                        },
                        update: {
                            quantity: qty,
                            createdAt: new Date(), // Reset expiry on activity
                        },
                        create: {
                            cartId: cart.id,
                            productId: item.productId,
                            quantity: qty,
                        },
                    });
                }
            }
        }

        // 4. Fetch Updated Cart
        const updatedCart = await prisma.cart.findUnique({
            where: { id: cart.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true,
                                inStock: true,
                                stock: true,
                            }
                        }
                    }
                }
            }
        });

        // Format for frontend: { productId: quantity } or list
        const cartMap = {};
        updatedCart.items.forEach(it => {
            if (it.product) {
                cartMap[it.productId] = it.quantity;
            }
        });

        return NextResponse.json({
            success: true,
            cartItems: cartMap,
            items: updatedCart.items
        });

    } catch (error) {
        console.error('Cart Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: Fetch clean cart
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        if (!userId) return NextResponse.json({});

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        if (!cart) return NextResponse.json({ cartItems: {} });

        // clean first
        await cleanExpiredCartItems(cart.id);

        // get fresh
        const freshItems = await prisma.cartItem.findMany({
            where: { cartId: cart.id },
        });

        const cartMap = {};
        freshItems.forEach(it => {
            cartMap[it.productId] = it.quantity;
        });

        return NextResponse.json({ cartItems: cartMap });

    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
