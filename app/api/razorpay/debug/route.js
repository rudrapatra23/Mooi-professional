// app/api/razorpay/auth-debug/route.js
import { auth, verifyToken } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    // headers visible to server
    const headers = Object.fromEntries(req.headers);

    // what auth() returns
    let clerkAuth = null;
    try {
      clerkAuth = auth(); // may throw or return {}
    } catch (e) {
      clerkAuth = { threw: String(e) };
    }

    // try verifying Authorization Bearer token if present
    const rawAuth = headers.authorization || "";
    const token = rawAuth.replace(/^Bearer\s+/i, "") || null;
    let verifyPayload = null;
    if (token) {
      try {
        verifyPayload = await verifyToken(token);
      } catch (e) {
        verifyPayload = { error: String(e) };
      }
    }

    // log to server console (so you can also inspect terminal)
    console.log("AUTH-DEBUG headers:", headers);
    console.log("AUTH-DEBUG auth():", clerkAuth);
    console.log("AUTH-DEBUG received token:", !!token, token ? token.slice(0,60) + "..." : null);
    console.log("AUTH-DEBUG verifyToken ->", verifyPayload);

    return new Response(
      JSON.stringify({
        ok: true,
        headersSummary: {
          hasCookie: !!headers.cookie,
          hasAuthorization: !!headers.authorization,
          authorizationPreview: headers.authorization ? headers.authorization.slice(0,80) + "..." : null
        },
        authResult: clerkAuth,
        verifyResult: verifyPayload
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("auth-debug error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}
