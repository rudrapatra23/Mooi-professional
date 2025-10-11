// app/api/email/preview/route.js
// preview route - remove in production when done
import { URL } from "url";

function escapeHtml(s=""){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function formatCurrency(amount){ return `₹${Number(amount||0).toFixed(2)}`; }

// small copy of template builder (kept minimal for preview)
function itemsTable(items=[]){ return (items.map(it => `<tr><td>${escapeHtml(it.name)}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${formatCurrency(it.price)}</td><td style="text-align:right">${formatCurrency((it.price||0)*(it.quantity||1))}</td></tr>`).join("")) || "<tr><td colspan='4'>No items</td></tr>"; }

export async function GET(req){
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "buyer";
  const sample = { buyerEmail:"customer@example.com", buyerName:"Test User", orderId:"MOI-PRV-001", items:[{name:"Shampoo",quantity:1,price:299.99},{name:"Serum",quantity:1,price:499}], subtotal:799.99, shipping:0, gst:0, discount:0 };
  const rows = itemsTable(sample.items);
  const html = `
  <!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#f4f6f8;padding:20px;">
  <div style="max-width:680px;margin:0 auto;background:#fff;padding:20px;border-radius:10px;">
  <div style="text-align:center;padding:18px;background:#0f172a;color:#fff;border-radius:8px;"><img src="${(process.env.NEXT_PUBLIC_BASE_URL||'http://localhost:3000')}/logo.png" alt="logo" style="height:56px"/><div style="margin-top:8px;font-weight:600">Mooi Professional</div></div>
  <h2 style="color:#0f172a">${type==='buyer'?'Order Confirmed':'New Order Received'}</h2>
  <p>Order ID: <strong>${sample.orderId}</strong></p>
  <table width="100%" style="border-collapse:collapse;margin-top:10px;"><thead><tr><th style="text-align:left">Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Subtotal</th></tr></thead><tbody>${rows}</tbody></table>
  <p style="margin-top:18px;font-weight:700">Total: ${formatCurrency(sample.subtotal)}</p>
  <div style="margin-top:20px;color:#888;font-size:13px">&copy; ${new Date().getFullYear()} Mooi Professional</div>
  </div></body></html>`;
  return new Response(html,{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}});
}
