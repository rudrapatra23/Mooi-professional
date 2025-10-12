// app/api/email/order/route.js
import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const BASE = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

function itemsTableHtml(items = []) {
  if (!items || !items.length) return `<p style="color:#666;font-size:14px;">No items</p>`;
  const rows = items.map(it => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${escapeHtml(it.name)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:center;width:60px;">${Number(it.quantity)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;width:110px;">${formatCurrency(it.price)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;width:110px;font-weight:600;">${formatCurrency((it.price || 0) * (it.quantity || 1))}</td>
    </tr>`).join("");
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;margin-bottom:10px;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="text-align:left;padding:10px 10px 10px 0;color:#444;font-weight:600;font-size:14px;">Item</th>
          <th style="text-align:center;padding:10px 0;color:#444;font-weight:600;width:60px;font-size:14px;">Qty</th>
          <th style="text-align:right;padding:10px 0;color:#444;font-weight:600;width:110px;font-size:14px;">Price</th>
          <th style="text-align:right;padding:10px 0 10px 10px;color:#444;font-weight:600;width:110px;font-size:14px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function createEmailHtml({
  title = "Order update",
  preheader = "",
  orderId,
  buyerName,
  buyerEmail,
  items = [],
  subtotal = 0,
  shipping = 0,
  gst = 0,
  discount = 0,
  isBuyer = true
}) {
  const logoUrl = `${BASE}/logo.png`;
  const itemsHtml = itemsTableHtml(items);
  const total = Number(subtotal || 0) + Number(shipping || 0) + Number(gst || 0) - Number(discount || 0);
  const primaryColor = "#000000";

  const headingText = isBuyer ? "Order confirmed" : "New order received";
  const subText = isBuyer
    ? `Hi ${escapeHtml(buyerName || "Customer")}, thank you for shopping with <strong>Mooi Professional</strong>. Your order <strong>#${escapeHtml(orderId)}</strong> has been confirmed and is being prepared. We’ll email you again when the order ships.`
    : `A new order <strong>#${escapeHtml(orderId)}</strong> has been placed by ${escapeHtml(buyerName || "Customer")}. Please review and process it in the admin panel.`;

  const sellerActionHtml = `<a href="${BASE.replace(/^http:/, 'https:')}/admin/orders" style="display:inline-block;margin-top:22px;padding:12px 20px;background:#000;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">Open Admin Orders →</a>
    <div style="margin-top:10px;color:#666;font-size:13px;">Admin email: <strong>${escapeHtml(process.env.SELLER_EMAIL || "admin@example.com")}</strong></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(title)}</title>
    <style>body{margin:0;padding:0;background:#f7f7f7;font-family:Inter,system-ui,-apple-system,Roboto,Arial,sans-serif;color:#333;} .wrap{max-width:680px;margin:40px auto;width:100%} .card{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eaeaea;box-shadow:0 2px 10px rgba(0,0,0,0.04)} .header{text-align:center;padding:35px 20px 20px 20px;background:#fff} .body{padding:28px 32px} .summary{background:#fafafa;border:1px solid #eee;padding:14px;border-radius:8px;margin-top:20px} @media (max-width:680px){.wrap{width:100% !important;margin:0 auto !important}.body{padding:20px !important}}</style>
  </head><body><center><div class="wrap"><div class="card"><div class="header"><img src="${escapeHtml(logoUrl)}" alt="Mooi Professional" style="height:48px;display:block;margin:0 auto;"></div>
  <div class="body"><h2 style="margin:0 0 10px 0;font-size:22px;font-weight:700;color:${primaryColor};">${escapeHtml(headingText)}</h2>
  <p style="margin:0 0 20px 0;color:#555;font-size:15px;line-height:1.5;">${subText}</p>
  <div style="border-left:3px solid ${primaryColor};padding-left:14px;margin-bottom:22px;background:#f9f9f9;padding:12px;border-radius:4px;">
  <p style="margin:0 0 6px 0;font-size:14px;color:#444;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
  ${isBuyer ? `<p style="margin:0;font-size:14px;color:#444;">A confirmation has been sent to <a href="mailto:${escapeHtml(buyerEmail)}" style="color:${primaryColor};text-decoration:none;">${escapeHtml(buyerEmail)}</a></p>` : `<p style="margin:0;font-size:14px;color:#444;">Buyer: <strong>${escapeHtml(buyerName || "N/A")}</strong> — <a href="mailto:${escapeHtml(buyerEmail)}" style="color:${primaryColor};text-decoration:none;">${escapeHtml(buyerEmail)}</a></p>`}
  </div>
  <h3 style="margin-top:8px;margin-bottom:8px;color:#111;font-size:16px;font-weight:600;">Order Summary</h3>${itemsHtml}
  <div class="summary"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tbody>
  <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;">${formatCurrency(subtotal)}</td></tr>
  <tr><td style="padding:4px 0;">Shipping</td><td style="text-align:right;">${formatCurrency(shipping)}</td></tr>
  <tr><td style="padding:4px 0;">GST</td><td style="text-align:right;">${formatCurrency(gst)}</td></tr>
  ${Number(discount) ? `<tr><td style="padding:4px 0;color:#1b7a3b;">Discount</td><td style="text-align:right;color:#1b7a3b;">-${formatCurrency(discount)}</td></tr>` : ""}
  <tr><td colspan="2"><div style="height:1px;background:#e0e0e0;margin:8px 0;"></div></td></tr>
  <tr><td style="padding:4px 0;font-weight:700;font-size:17px;">Total</td><td style="text-align:right;font-weight:700;font-size:17px;">${formatCurrency(total)}</td></tr>
  </tbody></table></div>
  <div style="margin-top:18px;">${isBuyer ? "" : sellerActionHtml}</div>
  <p style="margin-top:28px;color:#555;font-size:13px;line-height:1.6;">${isBuyer ? `If questions, contact <a href="mailto:${escapeHtml(process.env.SELLER_EMAIL || "info@mooiprofessional.com")}" style="color:${primaryColor};text-decoration:none;">${escapeHtml(process.env.SELLER_EMAIL || "info@mooiprofessional.com")}</a>.` : `For assistance, email <a href="mailto:${escapeHtml(process.env.SELLER_EMAIL || "info@mooiprofessional.com")}" style="color:${primaryColor};text-decoration:none;">${escapeHtml(process.env.SELLER_EMAIL || "info@mooiprofessional.com")}</a>.`}</p>
  </div><div style="padding:20px;text-align:center;color:#999;font-size:13px;border-top:1px solid #f0f0f0;">&copy; ${new Date().getFullYear()} Mooi Professional — All rights reserved</div></div></div></center></body></html>`;
}

/* ---- Protected API route ---- */
export async function POST(req) {
  try {
    // Require server-side secret header to prevent public abuse
    const secret = req.headers.get("x-internal-key") || "";
    if (!process.env.INTERNAL_EMAIL_KEY || secret !== process.env.INTERNAL_EMAIL_KEY) {
      console.warn("[api/email] forbidden - missing or invalid internal key");
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

    const { buyerEmail, buyerName, orderId, items = [], subtotal = 0, shipping = 0, gst = 0, discount = 0 } = body;

    if (!buyerEmail || !orderId) {
      return NextResponse.json({ ok: false, error: "missing_required_fields" }, { status: 400 });
    }

    const totalAmount = Number(subtotal || 0) + Number(shipping || 0) + Number(gst || 0) - Number(discount || 0);

    const buyerHtml = createEmailHtml({
      title: `Order Confirmed: #${orderId}`,
      preheader: `Your order ${orderId} is confirmed. Total: ${formatCurrency(totalAmount)}.`,
      orderId,
      buyerName,
      buyerEmail,
      items,
      subtotal,
      shipping,
      gst,
      discount,
      isBuyer: true
    });

    const sellerHtml = createEmailHtml({
      title: `New Order Received — #${orderId}`,
      preheader: `New order ${orderId} by ${buyerName || "Customer"} — total ${formatCurrency(totalAmount)}`,
      orderId,
      buyerName,
      buyerEmail,
      items,
      subtotal,
      shipping,
      gst,
      discount,
      isBuyer: false
    });

    const buyerMsg = {
      to: buyerEmail,
      from: process.env.EMAIL_FROM,
      subject: `Order Confirmation — ${orderId} | ${formatCurrency(totalAmount)}`,
      html: buyerHtml,
    };

    const sellerMsg = {
      to: process.env.SELLER_EMAIL,
      from: process.env.EMAIL_FROM,
      subject: `NEW ORDER: ${orderId} (${formatCurrency(totalAmount)})`,
      html: sellerHtml,
    };

    const results = await Promise.allSettled([sgMail.send(buyerMsg), sgMail.send(sellerMsg)]);
    const debug = results.map((r, i) =>
      r.status === "fulfilled"
        ? { idx: i, status: "ok" }
        : { idx: i, status: "error", details: r.reason?.response?.body ?? r.reason?.message ?? String(r.reason) }
    );

    const hasError = debug.find(d => d.status === "error");
    if (hasError) {
      console.error("[api/email] send errors:", debug);
      return NextResponse.json({ ok: false, debug }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[api/email] unexpected error:", err);
    const details = err?.response?.body ?? err?.message ?? String(err);
    return NextResponse.json({ ok: false, error: "internal", details }, { status: 500 });
  }
}
