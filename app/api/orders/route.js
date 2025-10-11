// app/api/orders/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

/** helpers */
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
    if (!res.ok) {
      console.warn("[orders][admin] clerk REST fetch failed", res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("[orders][admin] clerk REST fetch error:", err?.message ?? err);
    return null;
  }
}

async function resolveAdminEmails(userId) {
  // Try clerk SDK first (if installed)
  try {
    const clerkClient = (() => {
      try {
        return require("@clerk/nextjs/server")?.clerkClient;
      } catch (e) {
        return undefined;
      }
    })();

    if (clerkClient && clerkClient.users && typeof clerkClient.users.getUser === "function") {
      const user = await clerkClient.users.getUser(userId);
      return (user?.emailAddresses ?? []).map(e => (e?.emailAddress || "").toLowerCase()).filter(Boolean);
    }
  } catch (err) {
    console.warn("[orders][admin] clerkClient.getUser failed:", err?.message ?? err);
  }

  // Fallback: Clerk REST API
  const rest = await fetchClerkUserById(userId);
  if (!rest) return [];
  return (rest?.email_addresses ?? rest?.emailAddresses ?? [])
    .map(e => (e?.email_address || e?.emailAddress || "").toLowerCase())
    .filter(Boolean);
}

async function isAdminByEmail(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("[orders][admin] getAuth returned no userId");
      return false;
    }

    const allowedEmails = parseList(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "");
    const allowedUserIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

    if (allowedUserIds.length && allowedUserIds.includes(userId)) {
      console.log("[orders][admin] userId matched ADMIN_USER_IDS");
      return true;
    }

    if (!allowedEmails.length) {
      console.warn("[orders][admin] ADMIN_EMAILS not configured; denying admin access");
      return false;
    }

    const resolvedEmails = await resolveAdminEmails(userId);
    if (!resolvedEmails.length) {
      console.warn("[orders][admin] could not resolve user emails; cannot authorize by email");
      return false;
    }

    const allowedLower = allowedEmails.map(s => s.toLowerCase());
    const match = resolvedEmails.some(e => allowedLower.includes(e));
    if (match) {
      console.log("[orders][admin] email matched ADMIN_EMAILS");
      return true;
    }

    console.log("[orders][admin] no email match for user");
    return false;
  } catch (err) {
    console.warn("[orders][admin] isAdminByEmail error:", err?.message ?? err);
    return false;
  }
}

/** OPTIONS for preflight */
export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * GET /api/orders?admin=true
 * Protected admin listing (Clerk-based allowlist).
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const isAdminList = url.searchParams.get("admin") === "true" || url.searchParams.get("adminList") === "1";
    if (!isAdminList) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }

    const allowed = await isAdminByEmail(req);
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 200);
    const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0);

    // Safe DB query
    let orders;
    try {
      orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          payments: true,
          orderItems: { include: { product: true } },
          address: true,
          user: true,
        },
      });
    } catch (dbErr) {
      console.error("[orders][admin] DB error while fetching orders:", dbErr?.message || dbErr);
      return NextResponse.json({
        ok: false,
        error: "database_unavailable",
        message: "Cannot reach database server. Contact admin.",
      }, { status: 503 });
    }

    return NextResponse.json({ ok: true, orders }, { status: 200 });
  } catch (err) {
    console.error("[orders][admin] unexpected error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "internal" }, { status: 500 });
  }
}

/**
 * PATCH /api/orders
 * Body: { orderId, status }
 * Admin only: update order status
 */
export async function PATCH(req) {
  try {
    const allowed = await isAdminByEmail(req);
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
    }

    // Adjust allowed statuses to match your Prisma enum if needed
    const allowedStatuses = ["ORDER_PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { orderItems: { include: { product: true } }, payments: true, address: true, user: true },
    });

    return NextResponse.json({ ok: true, order: updatedOrder }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/orders error:", err);
    return NextResponse.json({ ok: false, error: err?.message || "internal" }, { status: 500 });
  }
}
