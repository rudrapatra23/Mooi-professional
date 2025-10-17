import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

let clerkClient = undefined;
try {
  clerkClient = require("@clerk/nextjs/server")?.clerkClient;
} catch (e) {
  clerkClient = undefined;
}

function parseList(envVar) {
  if (!envVar) return [];
  return envVar.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}

async function fetchClerkUserById(userId) {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.clerk.dev/v1/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function isAdminByEmailOrId(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return false;

    const envEmails = parseList(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "");
    const envUserIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

    if (envUserIds.includes(userId)) return true;
    if (!envEmails.length) return false;

    let resolvedEmails = [];

    if (clerkClient?.users?.getUser) {
      const user = await clerkClient.users.getUser(userId);
      resolvedEmails = (user?.emailAddresses ?? []).map(e => (e?.emailAddress || "").toLowerCase());
    }

    if (!resolvedEmails.length && process.env.CLERK_SECRET_KEY) {
      const user = await fetchClerkUserById(userId);
      resolvedEmails = (user?.email_addresses ?? [])
        .map(e => (e?.email_address || "").toLowerCase())
        .filter(Boolean);
    }

    return resolvedEmails.some(e => envEmails.includes(e));
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET(req) {
  try {
    const allowed =
      process.env.NODE_ENV === "development" ? true : await isAdminByEmailOrId(req);
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paidWhere = {
      OR: [
        { paymentMethod: "COD" },
        {
          AND: [
            { paymentMethod: "RAZORPAY" },
            { payments: { some: { status: "SUCCESS" } } },
          ],
        },
      ],
    };

    // ✅ get all orders with createdAt + total for the chart
    const allOrders = await prisma.order.findMany({
      where: paidWhere,
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    });

    const [ordersCount, productsCount, revenueAgg] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({ where: paidWhere, _sum: { total: true } }),
    ]);

    const revenue = revenueAgg._sum?.total ?? 0;

    return NextResponse.json(
      { ok: true, ordersCount, productsCount, revenue, allOrders },
      { status: 200 }
    );
  } catch (err) {
    console.error("[admin/dashboard] error:", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
