// app/api/webhooks/clerk/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || "";
const CLERK_API_KEY = process.env.CLERK_API_KEY || "";

// Simple HMAC verification helper (adjust if Clerk provides a different format)
function verifySignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET) {
    // dev fallback: skip verification if not configured
    console.warn("CLERK_WEBHOOK_SECRET not set — skipping signature verification (dev only).");
    return true;
  }
  if (!signatureHeader) return false;

  // Clerk's exact signature format may vary; if Clerk gives a header like "t=..., v1=...", parse accordingly.
  // If Clerk provides raw hex HMAC in header, use this; otherwise adapt to the format Clerk returns.
  // This implementation assumes the header directly contains the hex HMAC.
  try {
    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");
    // Use timingSafeEqual to avoid timing attacks
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
  } catch (e) {
    console.error("Signature verify error:", e);
    return false;
  }
}

// fetch full user from Clerk Admin API
async function fetchClerkUser(userId) {
  if (!CLERK_API_KEY) {
    throw new Error("CLERK_API_KEY not configured");
  }

  const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${CLERK_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch Clerk user: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data;
}

export async function POST(request) {
  try {
    // Read raw body for signature verification and for parsing
    const rawBody = await request.text();
    const signatureHeader =
      request.headers.get("x-clerk-signature") ||
      request.headers.get("clerk-signature") ||
      request.headers.get("x-signature") ||
      "";

    // verify signature if secret provided
    if (WEBHOOK_SECRET && !verifySignature(rawBody, signatureHeader)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.warn("Failed to parse webhook JSON:", e);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Clerk payload shapes vary; try to extract event type and user id
    // Common shape: { type: "user.created", data: { user: { id: "user_xxx", ... } } }
    // Or: { type: "user.created", data: { id: "user_xxx", ... } }
    const eventType = payload?.type || payload?.event || null;
    let clerkUserId =
      payload?.data?.user?.id ||
      payload?.data?.id ||
      payload?.data?.user_id ||
      payload?.data?.userId ||
      null;

    // If user id not present in payload, abort (we only care about user events)
    if (!clerkUserId) {
      console.warn("No Clerk user id in payload, ignoring event:", payload);
      return NextResponse.json({ ok: true });
    }

    // We only handle creation/upsert on user.created or user.updated (safe to upsert on both)
    if (!["user.created", "user.updated", "user.email.updated", "user.profile.updated"].includes(eventType)) {
      // ignore other events
      return NextResponse.json({ ok: true });
    }

    // Fetch full user details from Clerk Admin API to ensure we have required fields
    let clerkUser;
    try {
      clerkUser = await fetchClerkUser(clerkUserId);
    } catch (e) {
      console.error("Error fetching clerk user:", e);
      // If fetch fails, we can still attempt to use whatever payload contains, but prefer failing early.
      return NextResponse.json({ error: "Failed to fetch user from Clerk" }, { status: 500 });
    }

    // Map clerk user fields -> your User model fields (adjust as needed)
    const uid = String(clerkUser.id);
    const email =
      clerkUser.email_addresses?.[0]?.email_address ||
      clerkUser.primary_email_address ||
      clerkUser.email ||
      null;
    const name = clerkUser.full_name || `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() || null;
    const image = clerkUser.profile_image_url || clerkUser.image_url || null;

    // Basic validation: ensure required fields exist; if not, set reasonable defaults
    const safeName = name || "Clerk User";
    const safeEmail = email || `${uid}@no-email.clerk`; // fallback if Clerk account has no email
    const safeImage = image || "";

    // Upsert into Prisma
    const upserted = await prisma.user.upsert({
      where: { id: uid },
      update: { name: safeName, email: safeEmail, image: safeImage },
      create: { id: uid, name: safeName, email: safeEmail, image: safeImage },
    });

    console.log("Clerk webhook upserted user:", upserted.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Clerk webhook handler error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
