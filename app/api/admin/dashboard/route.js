// app/api/admin/dashboard/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

// Try to import clerkClient if available; wrap in try/catch to avoid runtime crash if not present.
let clerkClient = undefined;
try {
  // require-style dynamic import so bundler won't hard-fail if package isn't available at runtime
  // eslint-disable-next-line no-undef
  clerkClient = require("@clerk/nextjs/server")?.clerkClient;
} catch (e) {
  clerkClient = undefined;
}

/**
 * Normalize environment lists
 */
function parseList(envVar) {
  if (!envVar) return [];
  return envVar.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}

/**
 * Fetch Clerk user via REST API using CLERK_SECRET_KEY (server key).
 * Returns user JSON or null.
 */
async function fetchClerkUserById(userId) {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.clerk.dev/v1/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      console.warn("[admin/dashboard] clerk REST fetch failed", res.status);
      return null;
    }
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn("[admin/dashboard] clerk REST fetch error:", err?.message ?? err);
    return null;
  }
}

/**
 * Determine whether the signed-in Clerk user is an admin.
 * Supports three modes:
 * 1) clerkClient available -> use clerkClient to fetch user emails
 * 2) CLERK_SECRET_KEY provided -> call Clerk REST API to fetch user emails
 * 3) fallback to ADMIN_USER_IDS (list of Clerk userIds)
 *
 * ADMIN_EMAILS or ADMIN_EMAIL (comma-separated or single) controls email allowlist.
 */
async function isAdminByEmailOrId(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("[admin] getAuth returned no userId.");
      return false;
    }

    // prepare allowed lists
    const envEmails = parseList(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "");
    const envUserIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

    // 1) If admin by userId explicitly allowed
    if (envUserIds.length && envUserIds.includes(userId)) {
      console.log("[admin] userId matched ADMIN_USER_IDS");
      return true;
    }

    // 2) If we have an email allowlist, try to resolve user's emails
    if (envEmails.length) {
      let resolvedEmails = [];

      // prefer clerkClient if available
      if (clerkClient && clerkClient.users && typeof clerkClient.users.getUser === "function") {
        try {
          const user = await clerkClient.users.getUser(userId);
          resolvedEmails = (user?.emailAddresses ?? []).map(e => (e?.emailAddress || "").toLowerCase()).filter(Boolean);
          console.log("[admin] resolvedEmails (clerkClient)", resolvedEmails);
        } catch (err) {
          console.warn("[admin] clerkClient.getUser failed:", err?.message ?? err);
        }
      }

      // fallback to REST API if we couldn't resolve via clerkClient
      if (!resolvedEmails.length && process.env.CLERK_SECRET_KEY) {
        const user = await fetchClerkUserById(userId);
        if (user) {
          resolvedEmails = (user?.email_addresses ?? user?.emailAddresses ?? [])
            .map(e => (e?.email_address || e?.emailAddress || "").toLowerCase())
            .filter(Boolean);
          console.log("[admin] resolvedEmails (clerk REST)", resolvedEmails);
        }
      }

      // If we could not resolve emails, we cannot authorize by email
      if (!resolvedEmails.length) {
        console.warn("[admin] could not resolve user emails; ensure clerkClient or CLERK_SECRET_KEY is available, or use ADMIN_USER_IDS.");
        return false;
      }

      // compare intersection
      const allowedLower = envEmails.map(s => s.toLowerCase());
      const isMatch = resolvedEmails.some(e => allowedLower.includes(e));
      if (isMatch) {
        console.log("[admin] email matched ADMIN_EMAILS");
        return true;
      } else {
        console.log("[admin] no email match for user");
      }

      return false;
    }

    // If no email allowlist configured but ADMIN_USER_IDS not set, deny access
    console.warn("[admin] no ADMIN_EMAILS or ADMIN_USER_IDS configured; denying access");
    return false;
  } catch (err) {
    console.warn("[admin] isAdminByEmailOrId error:", err?.message ?? err);
    return false;
  }
}

/** OPTIONS handler (preflight) */
export async function OPTIONS() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

/** GET handler */
export async function GET(req) {
  try {
    const allowed = await isAdminByEmailOrId(req);
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // revenue: COD orders + RAZORPAY orders that have a successful payment record
    const paidWhere = {
      OR: [
        { paymentMethod: "COD" },
        { AND: [{ paymentMethod: "RAZORPAY" }, { payments: { some: { status: "SUCCESS" } } }] },
      ],
    };

    const [ordersCount, productsCount, revenueAgg] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.order.aggregate({ where: paidWhere, _sum: { total: true } }),
    ]);

    const revenue = revenueAgg._sum?.total ?? 0;
    return NextResponse.json({ ok: true, ordersCount, productsCount, revenue }, { status: 200 });
  } catch (err) {
    console.error("[admin/dashboard] error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "internal" }, { status: 500 });
  }
}
