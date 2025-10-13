// app/components/OrderSummary.jsx
'use client';
import { PlusIcon, SquarePenIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';

const OrderSummary = ({ totalPrice = 0, items = [] }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
  const router = useRouter();

  const addressList = useSelector((state) => state.address.list || []);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // constants and calculations
  const SHIPPING_FEE = 99;
  const GST_RATE = 0.18;

  // GST computed from subtotal (no coupon/discount)
  const gstAmount = useMemo(() => {
    const base = Number(totalPrice || 0);
    return Number((base * GST_RATE).toFixed(2));
  }, [totalPrice]);

  const finalTotal = useMemo(() => {
    const tot = Number(totalPrice || 0) + Number(gstAmount || 0) + Number(SHIPPING_FEE || 0);
    return Number(tot.toFixed(2));
  }, [totalPrice, gstAmount]);

  // ----- Razorpay helper (unchanged) -----
  const openRazorpayCheckout = (razorpayData, orderId) => {
    if (!window?.Razorpay) {
      toast.error('Razorpay SDK not loaded. Please try again.');
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayData.amount, // in paisa
      currency: razorpayData.currency || 'INR',
      name: 'Mooi Professional',
      description: 'Order Payment',
      order_id: razorpayData.razorpayOrderId,
      handler: async (response) => {
        try {
          setLoading(true);
          const token = await getToken();
          const verifyRes = await axios.post('/api/order/confirm', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          }, { headers: { Authorization: `Bearer ${token}` }});

          if (verifyRes.data?.ok) {
            toast.success('Payment successful');
            dispatch(fetchCart({ getToken }));
            router.push(`/order-success?orderId=${encodeURIComponent(verifyRes.data.order.id)}`);
          } else {
            toast.error(verifyRes.data?.error || 'Payment verification failed');
          }
        } catch (err) {
          toast.error(err?.response?.data?.error || err.message || 'Payment verification failed');
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: user?.fullName || '',
        email: user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress || '',
      },
      theme: { color: '#111827' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Place order (no coupon/discount fields)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast('Please login to place an order');
      if (!selectedAddress) return toast('Please select an address');

      setLoading(true);
      const token = await getToken();

      const itemsPayload = (items || []).map(it => ({
        id: it.id ?? it.productId ?? (it.product && (it.product.id || it.product._id)),
        quantity: Number(it.quantity ?? it.qty ?? 1),
        price: Number(it.price ?? it.unitPrice ?? it.product?.price ?? 0),
      })).filter(it => !!it.id);

      const orderData = {
        addressId: selectedAddress.id ?? selectedAddress.addressId ?? selectedAddress._id,
        paymentMethod,
        items: itemsPayload,
        gstAmount: Number(gstAmount.toFixed(2)),   // explicit monetary GST
        shipping: Number(SHIPPING_FEE.toFixed(2)),
        total: Number(finalTotal.toFixed(2)),
        // no discount / coupon fields
      };

      console.log('ORDER DATA SENT ===>', JSON.stringify(orderData, null, 2));

      const { data } = await axios.post('/api/order/create', orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!data) throw new Error('No response from server');

      if (paymentMethod === 'RAZORPAY') {
        const { razorpayOrderId, amount, currency, keyId, order: createdOrder } = data;
        if (!window.Razorpay) {
          toast.error('Razorpay SDK missing. Add <script src="https://checkout.razorpay.com/v1/checkout.js"></script> to your layout.');
          return;
        }
        const options = {
          key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount,
          currency,
          order_id: razorpayOrderId,
          name: 'Your Shop',
          description: 'Order Payment',
          handler: async function (resp) {
            try {
              const token2 = await getToken();
              const verify = await axios.post('/api/order/confirm', {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
              }, { headers: { Authorization: `Bearer ${token2}` } });

              if (verify.data?.ok) {
                toast.success('Payment successful');
                dispatch(fetchCart({ getToken }));
                router.push('/order-success?orderId=' + encodeURIComponent(createdOrder?.id ?? ''));
              } else {
                toast.error(verify.data?.error || 'Payment verification failed');
              }
            } catch (err) {
              toast.error(err?.response?.data?.error || err.message || 'Verification failed');
            }
          },
          prefill: {
            name: user?.fullName || '',
            email: user?.primaryEmailAddress || (user?.emailAddresses?.[0]?.emailAddress || ''),
          },
          theme: { color: '#111827' },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // COD flow — server creates order and clears cart
      if (data?.ok) {
        toast.success(data.message || 'Order placed successfully');
        dispatch(fetchCart({ getToken }));
        const orderId = data.order?.id ?? (Array.isArray(data.orders) ? data.orders[0]?.id : undefined) ?? '';
        if (orderId) router.push('/order-success?orderId=' + encodeURIComponent(orderId));
        else router.push('/orders');
      } else {
        throw new Error(data?.error || 'Order creation failed');
      }
    } catch (error) {
      console.error('handlePlaceOrder error:', error);
      toast.error(error?.response?.data?.error || error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7">
      <h2 className="text-xl font-medium text-slate-600">Payment Summary</h2>
      <p className="text-slate-400 text-xs my-4">Payment Method</p>

      {/* Payment Method */}
      <div className="flex gap-2 items-center">
        <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className="accent-gray-500" />
        <label htmlFor="COD" className="cursor-pointer">COD</label>
      </div>
      <div className="flex gap-2 items-center mt-1">
        <input type="radio" id="RAZORPAY" name="payment" onChange={() => setPaymentMethod('RAZORPAY')} checked={paymentMethod === 'RAZORPAY'} className="accent-gray-500" />
        <label htmlFor="RAZORPAY" className="cursor-pointer">RAZORPAY Payment</label>
      </div>

      {/* Address Section */}
      <div className="my-4 py-4 border-y border-slate-200 text-slate-400">
        <p>Address</p>
        {selectedAddress ? (
          <div className="flex gap-2 items-center">
            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
            <SquarePenIcon onClick={() => setSelectedAddress(null)} className="cursor-pointer" size={18} />
          </div>
        ) : (
          <div>
            {addressList.length > 0 && (
              <select className="border border-slate-400 p-2 w-full my-3 outline-none rounded" onChange={(e) => setSelectedAddress(addressList[e.target.value])}>
                <option value="">Select Address</option>
                {addressList.map((address, index) => (
                  <option key={index} value={index}>
                    {address.name}, {address.city}, {address.state}, {address.zip}
                  </option>
                ))}
              </select>
            )}
            <button className="flex items-center gap-1 text-slate-600 mt-1" onClick={() => setShowAddressModal(true)}>
              Add Address <PlusIcon size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex justify-between">
          <div className="flex flex-col gap-1 text-slate-400">
            <p>Subtotal:</p>
            <p>Shipping:</p>
            <p>GST (18%):</p>
          </div>
          <div className="flex flex-col gap-1 font-medium text-right">
            <p>{currency}{Number(totalPrice || 0).toLocaleString()}</p>
            <p><Protect plan={'plus'} fallback={`${currency}${SHIPPING_FEE}`}>Free</Protect></p>
            <p>{currency}{gstAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between py-4">
        <p>Total:</p>
        <p className="font-medium text-right">{currency}{finalTotal.toFixed(2)}</p>
      </div>

      <button
        onClick={(e) => toast.promise(handlePlaceOrder(e), { loading: 'Placing Order...' })}
        className="w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Place Order'}
      </button>

      {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
    </div>
  );
};

export default OrderSummary;
