// app/api/order/confirm/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Find payments/orders linked to this razorpay_order_id
    // Assumes you stored razorpayOrderId on payments
    const payments = await prisma.payment.findMany({ where: { razorpayOrderId: razorpay_order_id } });
    if (!payments || payments.length === 0) {
      // If you instead stored razorpayOrderId on orders, query orders and then payments
      return NextResponse.json({ error: 'No matching order found for this payment' }, { status: 404 });
    }

    const orderIds = payments.map(p => p.orderId);

    // Mark payment(s) success and orders as paid/confirmed
    await prisma.payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        status: 'SUCCESS',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }
    });

    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: {
        status: 'CONFIRMED',
        isPaid: true
      }
    });

    // Clear user's cart
    await prisma.user.update({
      where: { id: userId },
      data: { cart: {} }
    });

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { orderItems: { include: { product: true } }, address: true }
    });

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    console.error('Razorpay confirm error:', err);
    return NextResponse.json({ ok: false, error: err.message || 'internal' }, { status: 500 });
  }
}
