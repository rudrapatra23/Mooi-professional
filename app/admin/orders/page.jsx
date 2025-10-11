// app/admin/orders/page.jsx
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

      const res = await axios.get('/api/orders?admin=true', {
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
                {orders.map((order, index) => (
                  <tr
                    key={order.id ?? order.orderId ?? index}
                    className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                  >
                    <td className="pl-6 text-emerald-600">{index + 1}</td>
                    <td className="px-4 py-3">{order.user?.name ?? order.userName ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">₹{(order.total ?? order.amount ?? 0).toFixed ? (Number(order.total ?? order.amount ?? 0)).toFixed(2) : (order.total ?? order.amount ?? 0)}</td>
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
                            const res = await axios.patch('/api/orders', { orderId: order.id, status: newStatus }, {
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && selectedOrder && (
          <div onClick={() => { setIsModalOpen(false); setSelectedOrder(null); }} className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Order Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-slate-500 mb-2">Items</h3>
                  <ul className="space-y-2">
                    {(selectedOrder.orderItems ?? selectedOrder.items ?? []).map((it, i) => (
                      <li key={it.id ?? i} className="flex justify-between">
                        <div>
                          <div className="font-medium">{it?.product?.name ?? it?.name ?? `Product ${it?.productId ?? it?.id ?? ''}`}</div>
                          <div className="text-xs text-slate-500">Qty: {it.quantity ?? it.qty ?? 1} • ₹{it.price ?? it.unitPrice ?? 0}</div>
                        </div>
                        <div className="text-sm text-slate-700">₹{((it.price ?? it.unitPrice ?? 0) * (it.quantity ?? it.qty ?? 1)).toFixed(2)}</div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm text-slate-500 mb-2">Payment</h3>
                  <div className="text-sm">
                    {(selectedOrder.payments ?? []).map((p, i) => (
                      <div key={p.id ?? i} className="flex justify-between">
                        <div>{p.method ?? 'PAY'}</div>
                        <div>₹{(p.amount ?? 0).toFixed ? Number(p.amount).toFixed(2) : (p.amount ?? 0)}</div>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm text-slate-500 mt-4 mb-1">Address</h3>
                  {selectedOrder.address ? (
                    <div className="text-sm text-slate-700">
                      {selectedOrder.address.name ?? ''}<br />
                      {selectedOrder.address.line1 ?? ''} {selectedOrder.address.city ?? ''} {selectedOrder.address.zip ?? ''}
                    </div>
                  ) : <div className="text-sm text-slate-500">No address</div>}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { setIsModalOpen(false); setSelectedOrder(null); }} className="px-4 py-2 bg-slate-200 rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
