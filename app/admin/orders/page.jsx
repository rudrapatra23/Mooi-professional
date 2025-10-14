'use client';
import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { getToken, isLoaded } = useAuth();

  useEffect(() => setMounted(true), []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('No auth token. Please login.');
        setLoading(false);
        return;
      }

      const res = await axios.get('/api/admin/orders?admin=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // tolerate different API shapes
      const data = res.data;
      const ordersArray = data?.orders ?? data?.items ?? (Array.isArray(data) ? data : []);
      setOrders(ordersArray);
    } catch (error) {
      console.error('fetchOrders error:', error);
      toast.error(error?.response?.data?.error || error.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (loading) return <Loading />;

  // ----- Helper: safe display of amounts -----
  // Compute a reasonable amount to show (avoid showing garbage values from backend)
  const safeAmount = (order) => {
    // try to compute sum from order items
    const items = order?.orderItems ?? order?.items ?? [];
    const itemsSum = items.reduce((s, it) => {
      const price = Number(it?.price ?? it?.unitPrice ?? 0) || 0;
      const qty = Number(it?.quantity ?? it?.qty ?? 1) || 1;
      return s + price * qty;
    }, 0);

    // try candidate totals in order of trust
    const candidates = [
      Number(order?.total ?? NaN),
      Number(order?.amount ?? NaN),
      // payments array might have amounts (take first)
      Number(order?.payments?.[0]?.amount ?? NaN),
    ];

    // pick the first candidate that looks sane
    for (const c of candidates) {
      if (!Number.isFinite(c)) continue;
      // sanity checks: positive and not astronomically bigger than itemsSum
      if (c >= 0 && (itemsSum === 0 || c <= itemsSum * 1000)) {
        // if c is integer-like ensure 2 decimals
        return Number(c);
      }
    }

    // fallback to itemsSum (rounded)
    return Number(itemsSum);
  };

  const formatMoney = (val) => {
    const n = Number(val ?? 0) || 0;
    return n.toFixed(2);
  };

  // compute subtotal/gst/discount/shipping robustly for the invoice
  const computeTotals = (order) => {
    const items = order?.orderItems ?? order?.items ?? [];
    const subtotal = items.reduce((s, it) => {
      const price = Number(it?.price ?? it?.unitPrice ?? 0) || 0;
      const qty = Number(it?.quantity ?? it?.qty ?? 1) || 1;
      return s + price * qty;
    }, 0);

    // The backend sometimes stores gst, shipping, discount explicitly
    // Prefer server-provided values when they exist and look reasonable
    const gst = Number(order?.gst ?? order?.payments?.[0]?.gst ?? 0);
    const shipping = Number(order?.shipping ?? order?.shippingCharge ?? order?.payments?.[0]?.shipping ?? 0);
    const discount = Number(order?.discount ?? 0);

    // If gst looks like a rate (<= 1) convert to amount using subtotal
    let gstAmount = 0;
    if (gst > 1) {
      // likely monetary
      gstAmount = gst;
    } else if (gst > 0 && gst <= 1) {
      gstAmount = parseFloat((subtotal * gst).toFixed(2));
    } else {
      // fallback: try using order.total - subtotal - shipping (if present)
      const candidate = Number(order?.total) ? Number(order.total) - subtotal - shipping + (Number.isFinite(discount) ? discount : 0) : 0;
      if (candidate > 0) gstAmount = parseFloat(candidate.toFixed(2));
    }

    const totalServer = Number(order?.total ?? NaN);
    const computedTotal = parseFloat((subtotal + (Number.isFinite(gstAmount) ? gstAmount : 0) + (Number.isFinite(shipping) ? shipping : 0) - (Number.isFinite(discount) ? discount : 0)).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      gst: parseFloat(gstAmount.toFixed(2)),
      shipping: parseFloat(Number(shipping ?? 0).toFixed(2)),
      discount: parseFloat(Number(discount ?? 0).toFixed(2)),
      computedTotal,
      displayedTotal: Number.isFinite(totalServer) ? totalServer : computedTotal,
    };
  };

  // Normalize address object from order (address may be object or JSON string or nested)
  const normalizeAddress = (order) => {
    let addr = order?.address ?? order?.addressJson ?? order?.shippingAddress ?? null;
    if (!addr) return null;
    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch (e) {
        // maybe it's a plain string
        return { line1: addr };
      }
    }
    return addr;
  };

  // replace your existing printInvoice(order) with this function
const printInvoice = (order) => {
  try {
    const addr = normalizeAddress(order);
    const buyerName = order?.buyer?.name ?? order?.user?.name ?? order?.userName ?? 'Customer';
    const { subtotal, gst, shipping, discount, displayedTotal } = computeTotals(order);
    const items = order?.orderItems ?? order?.items ?? [];

    const html = `<!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${order?.id ?? order?.orderId ?? ''}</title>
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: #111827; padding: 24px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
        h1 { margin:0; font-size:20px; }
        .muted { color:#6b7280; font-size:13px; }
        table { width:100%; border-collapse:collapse; margin-top:16px; }
        th, td { padding:8px 6px; border-bottom:1px solid #e6e9ef; text-align:left; }
        .right { text-align:right; }
        .totals { margin-top:12px; width:100%; }
        .totals td { border:none; padding:6px 0; }
        .totals .label { color:#6b7280; }
        .total-amount { font-size:18px; font-weight:700; }
        @media print {
          body { padding: 12px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1>Invoice</h1>
            <div class="muted">Order: ${order?.id ?? order?.orderId ?? ''}</div>
            <div class="muted">Date: ${order?.createdAt ? new Date(order.createdAt).toLocaleString() : (new Date().toLocaleString())}</div>
          </div>
          <div style="text-align:right;">
            <div><strong>${buyerName}</strong></div>
            ${addr ? `
              <div class="muted">${addr.name ?? ''}</div>
              <div class="muted">${addr.line1 ?? addr.street ?? ''}</div>
              <div class="muted">${addr.city ?? ''} ${addr.zip ?? ''}</div>
              <div class="muted">${addr.state ?? ''} ${addr.country ?? ''}</div>
            ` : `<div class="muted">No address</div>`}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Details</th>
              <th class="right">Qty</th>
              <th class="right">Price</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => {
              const name = it?.product?.name ?? it?.name ?? `Product ${it?.productId ?? it?.id ?? ''}`;
              const qty = Number(it?.quantity ?? it?.qty ?? 1);
              const price = Number(it?.price ?? it?.unitPrice ?? 0);
              const amount = (qty * price).toFixed(2);
              return `<tr>
                <td>${escapeHtml(name)}</td>
                <td class="muted" style="font-size:13px">${it?.product?.sku ? 'SKU: ' + escapeHtml(it.product.sku) : ''}</td>
                <td class="right">${qty}</td>
                <td class="right">₹${price.toFixed(2)}</td>
                <td class="right">₹${amount}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>

        <table class="totals" style="margin-top:16px; float:right; width:320px;">
          <tr><td class="label">Subtotal</td><td class="right">₹${subtotal.toFixed(2)}</td></tr>
          <tr><td class="label">GST</td><td class="right">₹${gst.toFixed(2)}</td></tr>
          <tr><td class="label">Shipping</td><td class="right">₹${shipping.toFixed(2)}</td></tr>
          <tr><td class="label">Discount</td><td class="right">-₹${discount.toFixed(2)}</td></tr>
          <tr><td class="label total-amount">Total</td><td class="right total-amount">₹${displayedTotal.toFixed(2)}</td></tr>
        </table>

        <div style="clear:both; margin-top:28px; color:#6b7280; font-size:13px">
          Payment method: ${order?.paymentMethod ?? (order?.payments?.[0]?.method ?? '—')}
          ${order?.coupon ? ` • Coupon: ${order.coupon.code ?? order.coupon}` : ''}
        </div>

        <div class="no-print" style="margin-top:18px; color:#6b7280; font-size:13px;">
          If this window did not automatically trigger print, <a id="openLink" href="#" onclick="window.open(document.location.href); return false;">open the printable invoice</a>.
        </div>
      </div>

      <script>
        // small helper to attempt auto-print then close
        (function () {
          function tryPrintAndClose() {
            try {
              // Delay slightly to ensure fonts/images render
              setTimeout(function () {
                window.print();
                // Attempt to close: may fail if popup wasn't opened by script
                try { window.close(); } catch (e) {}
              }, 250);
            } catch (err) {
              // noop
            }
          }

          // If document already loaded, print. Otherwise wait for load.
          if (document.readyState === 'complete') {
            tryPrintAndClose();
          } else {
            window.addEventListener('load', tryPrintAndClose);
            // also fallback to DOMContentLoaded
            document.addEventListener('DOMContentLoaded', tryPrintAndClose);
          }

          // If popup was blocked, expose the HTML so user can open it manually.
          // We also set a short timeout to show the fallback link if print didn't start.
          setTimeout(function () {
            var fallback = document.getElementById('openLink');
            if (fallback) fallback.style.display = 'inline';
          }, 1200);
        }());
      </script>
    </body>
    </html>`;

    // Try to open a new window and write the HTML
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) {
      // popup blocked — open a blob URL instead (better chance)
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win2 = window.open(url, '_blank');
      if (!win2) {
        toast.error('Popup blocked. Please allow popups or open invoice in a new tab.');
        return;
      }
      // cleanup URL after some time
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }

    // Write document safely
    w.document.open();
    w.document.write(html);
    w.document.close();
  } catch (err) {
    console.error('printInvoice error', err);
    toast.error('Failed to open printable invoice');
  }
};

// small utility to escape HTML texts used above (prevents accidental HTML break)
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl text-slate-700 mb-4">Orders (Admin)</h1>

        {/* debug: show raw count */}
        <div className="mb-4 text-sm text-slate-500">Found {orders?.length ?? 0} orders</div>

        {orders.length === 0 ? (
          <div className="text-sm text-slate-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto rounded-md shadow border border-slate-200">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider">
                <tr>
                  {['Sr. No.', 'Customer', 'Total', 'Payment', 'Coupon', 'Status', 'Date'].map((h, i) => (
                    <th key={i} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order, index) => {
                  const displayTotal = safeAmount(order);
                  return (
                    <tr
                      key={order.id ?? order.orderId ?? index}
                      className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                    >
                      <td className="pl-6 text-emerald-600">{index + 1}</td>
                      <td className="px-4 py-3">{order.user?.name ?? order.userName ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">₹{formatMoney(displayTotal)}</td>
                      <td className="px-4 py-3">{order.paymentMethod ?? (order.payments?.[0]?.method ?? '—')}</td>
                      <td className="px-4 py-3">
                        {order.isCouponUsed ? (
                          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                            {order.coupon?.code ?? 'COUPON'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status ?? 'ORDER_PLACED'}
                          onChange={async (e) => {
                            e.stopPropagation();
                            const newStatus = e.target.value;
                            try {
                              const token = await getToken();
                              const res = await axios.patch('/api/admin/orders', { orderId: order.id, status: newStatus }, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              const updatedOrder = res.data?.order;
                              if (updatedOrder) {
                                setOrders(prev => prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o)));
                              } else {
                                setOrders(prev => prev.map(o => (o.id === order.id ? { ...o, status: newStatus } : o)));
                              }
                              toast.success('Status updated');
                            } catch (err) {
                              console.error('status update err', err);
                              toast.error(err?.response?.data?.error || err.message || 'Failed to update status');
                            }
                          }}
                          className="border-slate-300 rounded-md text-sm focus:ring focus:ring-blue-200"
                        >
                          <option value="ORDER_PLACED">ORDER_PLACED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {mounted ? (order.createdAt ? new Date(order.createdAt).toLocaleString() : '—') : (order.createdAt ? new Date(order.createdAt).toISOString() : '—')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && selectedOrder && (
          <div onClick={() => { setIsModalOpen(false); setSelectedOrder(null); }} className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold mb-1">Order Details</h2>
                <div className="text-sm text-slate-500">Order: <span className="font-medium">{selectedOrder.id ?? selectedOrder.orderId ?? '—'}</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="text-sm text-slate-500 mb-2">Items</h3>
                  <ul className="space-y-2">
                    {(selectedOrder.orderItems ?? selectedOrder.items ?? []).map((it, i) => (
                      <li key={it.id ?? i} className="flex justify-between">
                        <div>
                          <div className="font-medium">{it?.product?.name ?? it?.name ?? `Product ${it?.productId ?? it?.id ?? ''}`}</div>
                          <div className="text-xs text-slate-500">Qty: {it.quantity ?? it.qty ?? 1} • ₹{formatMoney(it.price ?? it.unitPrice ?? 0)}</div>
                        </div>
                        <div className="text-sm text-slate-700">₹{formatMoney((it.price ?? it.unitPrice ?? 0) * (it.quantity ?? it.qty ?? 1))}</div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm text-slate-500 mb-2">Payment & Shipping</h3>
                  <div className="text-sm space-y-2">
                    {(selectedOrder.payments ?? []).length ? (
                      (selectedOrder.payments ?? []).map((p, i) => {
                        // guard payment amount display; fallback to safeAmount(selectedOrder)
                        const pAmt = Number(p.amount);
                        const fallback = safeAmount(selectedOrder);
                        const amountToShow = (Number.isFinite(pAmt) && pAmt >= 0 && pAmt <= fallback * 1000) ? pAmt : fallback;
                        return (
                          <div key={p.id ?? i} className="flex justify-between">
                            <div>
                              <div className="font-medium">{p.method ?? 'Payment'}</div>
                              <div className="text-xs text-slate-500">{p.status ?? ''} {p.razorpayOrderId ? ` • RZP: ${p.razorpayOrderId}` : ''}</div>
                            </div>
                            <div>₹{formatMoney(amountToShow)}</div>
                          </div>
                        );
                      })
                    ) : (
                      // no payments: show safe total
                      <div className="flex justify-between">
                        <div className="font-medium">{selectedOrder.paymentMethod ?? '—'}</div>
                        <div>₹{formatMoney(safeAmount(selectedOrder))}</div>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm text-slate-500 mt-4 mb-1">Address</h3>
                  <div className="text-sm text-slate-700">
                    {(() => {
                      const addr = normalizeAddress(selectedOrder);
                      if (!addr) return 'No address';
                      return (
                        <>
                          <div>{addr.name ?? ''}</div>
                          <div>{addr.line1 ?? addr.street ?? ''}</div>
                          <div>{addr.city ?? ''} {addr.zip ?? ''}</div>
                          <div>{addr.state ?? ''} {addr.country ?? ''}</div>
                          <div className="text-xs text-slate-400 mt-1">{addr.phone ?? ''}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Totals block */}
              <div className="mt-4 border-t pt-4">
                {(() => {
                  const t = computeTotals(selectedOrder);
                  return (
                    <div className="max-w-md ml-auto">
                      <div className="flex justify-between text-sm text-slate-500">
                        <div>Subtotal</div><div>₹{formatMoney(t.subtotal)}</div>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <div>GST</div><div>₹{formatMoney(t.gst)}</div>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <div>Shipping</div><div>₹{formatMoney(t.shipping)}</div>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <div>Discount</div><div>-₹{formatMoney(t.discount)}</div>
                      </div>

                      <div className="flex justify-between mt-2 py-2 border-t font-medium text-slate-800">
                        <div>Total</div><div>₹{formatMoney(t.displayedTotal)}</div>
                      </div>

                      <div className="text-xs text-slate-500 mt-2">
                        Payment method: {selectedOrder.paymentMethod ?? (selectedOrder.payments?.[0]?.method ?? '—')}
                        {selectedOrder.coupon ? ` • Coupon: ${selectedOrder.coupon?.code ?? selectedOrder.coupon}` : ''}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 active:scale-95 transition"
                >
                  Print Invoice
                </button>
                <button onClick={() => { setIsModalOpen(false); setSelectedOrder(null); }} className="px-4 py-2 bg-slate-200 rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
