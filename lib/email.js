// lib/email.js
import sgMail from "@sendgrid/mail";
import { createEmailHtml } from "./emailTemplates"; // <- your template from earlier

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

/**
 * sendOrderEmails({ order })
 * - order should include: id, subtotal, shipping, gst, discount, orderItems (with product.name), buyer (with email,name)
 * - returns { ok: boolean, debug }
 */
export async function sendOrderEmails({ order }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("[email] SENDGRID_API_KEY not configured");
    return { ok: false, reason: "no_api_key" };
  }
  if (!process.env.EMAIL_FROM || !process.env.SELLER_EMAIL) {
    console.warn("[email] EMAIL_FROM or SELLER_EMAIL not configured");
    return { ok: false, reason: "no_email_settings" };
  }

  const items = (order.orderItems || []).map((oi) => ({
    name: oi.product?.name || oi.productId,
    quantity: oi.quantity,
    price: oi.price,
  }));

  const subtotal = order.subtotal ?? 0;
  const shipping = order.shipping ?? 0;
  const gst = order.gst ?? 0;
  const discount = order.discount ?? 0;
  const total = Number(subtotal) + Number(shipping) + Number(gst) - Number(discount);

  // Use your template function (createEmailHtml) to create buyer + seller HTML
  const buyerHtml = createEmailHtml({
    title: `Order Confirmed: #${order.id}`,
    preheader: `Your order ${order.id} is confirmed. Total: ${formatCurrency(total)}.`,
    orderId: order.id,
    buyerName: order.buyer?.name || "",
    buyerEmail: order.buyer?.email || "",
    items,
    subtotal,
    shipping,
    gst,
    discount,
    isBuyer: true,
  });

  const sellerHtml = createEmailHtml({
    title: `New Order Received — #${order.id}`,
    preheader: `New order ${order.id}`,
    orderId: order.id,
    buyerName: order.buyer?.name || "",
    buyerEmail: order.buyer?.email || "",
    items,
    subtotal,
    shipping,
    gst,
    discount,
    isBuyer: false,
  });

  const buyerMsg = {
    to: order.buyer?.email,
    from: process.env.EMAIL_FROM,
    subject: `Order Confirmation — ${order.id} | ${formatCurrency(total)}`,
    html: buyerHtml,
  };

  const sellerMsg = {
    to: process.env.SELLER_EMAIL,
    from: process.env.EMAIL_FROM,
    subject: `NEW ORDER: ${order.id} (${formatCurrency(total)})`,
    html: sellerHtml,
  };

  const results = await Promise.allSettled([sgMail.send(buyerMsg), sgMail.send(sellerMsg)]);
  const debug = results.map((r, i) =>
    r.status === "fulfilled" ? { idx: i, status: "ok" } : { idx: i, status: "error", reason: r.reason?.message ?? String(r.reason) }
  );

  const hasError = debug.some((d) => d.status === "error");
  return { ok: !hasError, debug };
}
