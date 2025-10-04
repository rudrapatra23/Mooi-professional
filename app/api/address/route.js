import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Add new address
export async function POST(request){
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { address } = await request.json();
        // Upsert user in DB
        await prisma.user.upsert({
            where: { id: userId },
            update: {
                name: user.firstName || user.username || user.id,
                email: user.emailAddresses?.[0]?.emailAddress,
                image: user.imageUrl,
            },
            create: {
                id: userId,
                name: user.firstName || user.username || user.id,
                email: user.emailAddresses?.[0]?.emailAddress,
                image: user.imageUrl,
            },
        });
        // Create address, connect to user
        const newAddress = await prisma.address.create({
            data: {
                ...address,
                user: { connect: { id: userId } },
            },
        });
        return NextResponse.json({ newAddress, message: 'Address added successfully' });
    } catch (error) {
        console.error(error);
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Foreign key constraint failed' }, { status: 400 });
        }
        return NextResponse.json({ error: error.code || error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// Get all addresses for a user
export async function GET(request){
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId }
        })

        return NextResponse.json({addresses})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}