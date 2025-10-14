// app/api/debug/echo/route.js
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({ ok: true, method: "OPTIONS" }, { status: 200 });
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => null);
    console.log("[echo] received PATCH body:", body);
    return NextResponse.json({ ok: true, method: "PATCH", body }, { status: 200 });
  } catch (err) {
    console.error("[echo] PATCH error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}

export async function POST(req) {
  const b = await req.json().catch(() => null);
  return NextResponse.json({ ok: true, method: "POST", body: b });
}
