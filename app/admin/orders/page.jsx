"use client";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("No auth token. Please login.");
        setLoading(false);
        return;
      }
      const { data } = await axios.get("/api/orders?admin=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(data.items || []);
    } catch (error) {
      console.error("fetchOrders error:", error);
      toast.error(
        error?.response?.data?.error ||
          error.message ||
          "Failed to fetch orders"
      );
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
      <h1 className="text-2xl text-slate-500 mb-5">Orders (Admin)</h1>

      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <div className="overflow-x-auto max-w-4xl rounded-md shadow border border-gray-200">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wider">
              <tr>
                {[
                  "Sr. No.",
                  "Customer",
                  "Total",
                  "Payment",
                  "Coupon",
                  "Status",
                  "Date",
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order, index) => (
                <tr
                  key={order.id || index}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="pl-6 text-green-600">{index + 1}</td>
                  <td className="px-4 py-3">{order.user?.name || "—"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    ₹{order.total ?? "0.00"}
                  </td>
                  <td className="px-4 py-3">{order.paymentMethod || "—"}</td>
                  <td className="px-4 py-3">
                    {order.isCouponUsed ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        {order.coupon?.code}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={order.status}
                      onChange={async (e) => {
                        e.stopPropagation();
                        const newStatus = e.target.value;
                        try {
                          const token = await getToken();
                          await axios.patch(
                            `/api/orders`,
                            { orderId: order.id, status: newStatus },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );

                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === order.id
                                ? { ...o, status: newStatus }
                                : o
                            )
                          );
                          toast.success("Status updated");
                        } catch (err) {
                          toast.error(
                            err?.response?.data?.error || err.message
                          );
                        }
                      }}
                      className="border-gray-300 rounded-md text-sm focus:ring focus:ring-blue-200"
                    >
                      <option value="ORDER_PLACED">ORDER_PLACED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {mounted
                      ? new Date(order.createdAt).toLocaleString()
                      : new Date(order.createdAt).toISOString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedOrder && (
        <div
          onClick={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            {/* keep your details UI here (same as before) */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-slate-200 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
