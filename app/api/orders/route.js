// app/api/orders/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

// try to import clerkClient safely (not all envs expose it)
let clerkClient;
try {
  // prefer static import use when available
  // eslint-disable-next-line import/no-extraneous-dependencies
  // this may throw in some environments so we guard it
  // if it fails we fallback to REST fetch
  // note: importing here is optional — if it fails we still work
  // and use REST API fallback in resolveAdminEmails
  // eslint-disable-next-line global-require
  clerkClient = require("@clerk/nextjs/server")?.clerkClient;
} catch (e) {
  clerkClient = undefined;
}

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
  try {
    if (clerkClient && clerkClient.users && typeof clerkClient.users.getUser === "function") {
      try {
        const user = await clerkClient.users.getUser(userId);
        return (user?.emailAddresses ?? []).map(e => (e?.emailAddress || "").toLowerCase()).filter(Boolean);
      } catch (e) {
        console.warn("[orders][admin] clerkClient.getUser failed:", e?.message ?? e);
        // fallthrough to REST fallback
      }
    }
  } catch (err) {
    console.warn("[orders][admin] clerkClient usage error:", err?.message ?? err);
  }

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

/** OPTIONS for preflight (CORS friendly) */
export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

/**
 * Combined GET:
 * - Admin listing when ?admin=true  -> returns { orders: [...] } (full)
 * - Authenticated user listing      -> returns { items: [...] } (limited fields / safe)
 */
export async function GET(req) {
  try {
    // robust URL parsing: handle both Request.url (string) and req.nextUrl (NextURL)
    let url;
    try {
      url = typeof req.url === "string" ? new URL(req.url) : (req.nextUrl || { searchParams: new URLSearchParams() });
    } catch (e) {
      // fallback
      url = req.nextUrl || { searchParams: new URLSearchParams() };
    }

    const isAdminList = (url.searchParams?.get("admin") === "true") || (url.searchParams?.get("adminList") === "1");

    // ----------------------
    // Admin listing
    // ----------------------
    if (isAdminList) {
      const allowed = await isAdminByEmail(req);
      if (!allowed) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 200);
      const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0);

      try {
        const orders = await prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take,
          skip,
          include: {
            payments: true,
            orderItems: { include: { product: true } },
            address: true,
            buyer: true,
          },
        });

        const mapped = (orders || []).map(o => {
          const { buyer, ...rest } = o;
          return { ...rest, user: buyer ?? null };
        });

        return NextResponse.json({ ok: true, orders: mapped }, { status: 200 });
      } catch (dbErr) {
        // log full DB error for debugging
        console.error("[orders][admin] DB error while fetching orders:", dbErr?.message ?? dbErr);
        if (dbErr?.stack) console.error(dbErr.stack);
        return NextResponse.json({
          ok: false,
          error: "database_unavailable",
          message: "Cannot reach database server. Check server logs.",
          details: dbErr?.message,
        }, { status: 503 });
      }
    }

    // ----------------------
    // Authenticated user's own orders
    // ----------------------
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const take = Math.min(Math.max(Number(url.searchParams.get("take") || 50), 1), 200);
    const skip = Math.max(Number(url.searchParams.get("skip") || 0), 0);

    try {
      const userOrders = await prisma.order.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          payments: { select: { id: true, status: true, amount: true, provider: true, createdAt: true } },
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, price: true, images: true },
              }
            }
          },
          address: { select: { id: true, line1: true, line2: true, city: true, state: true, postalCode: true } },
          buyer: { select: { id: true } },
        },
      });

      const mappedUserOrders = (userOrders || []).map(o => {
        const { buyer, ...rest } = o;
        return { ...rest, user: { id: buyer?.id ?? userId } };
      });

      return NextResponse.json({ ok: true, items: mappedUserOrders }, { status: 200 });
    } catch (dbErr) {
      console.error("[orders][user] DB error while fetching user's orders:", dbErr?.message ?? dbErr);
      if (dbErr?.stack) console.error(dbErr.stack);

      // if DB is truly fine (as you said) but prisma query failed due to schema mismatch,
      // return a helpful 500 with details in server logs. We avoid returning mock data here
      // because you said DB is OK and you don't want fake responses.
      return NextResponse.json({
        ok: false,
        error: "database_query_failed",
        message: "Failed to fetch your orders. Check server logs for details.",
        details: dbErr?.message,
      }, { status: 500 });
    }

  } catch (err) {
    console.error("[orders] unexpected error in GET:", err?.message ?? err);
    if (err?.stack) console.error(err.stack);
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

    const allowedStatuses = ["ORDER_PLACED", "PROCESSING", "SHIPPED", "DELIVERED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { orderItems: { include: { product: true } }, payments: true, address: true, buyer: true },
    });

    const { buyer, ...rest } = updatedOrder;
    const resOrder = { ...rest, user: buyer ?? null };

    return NextResponse.json({ ok: true, order: resOrder }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/orders error:", err?.message ?? err);
    if (err?.stack) console.error(err.stack);
    return NextResponse.json({ ok: false, error: err?.message || "internal" }, { status: 500 });
  }
}
