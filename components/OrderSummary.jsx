// app/components/OrderSummary.jsx
'use client';
import { PlusIcon, SquarePenIcon, TagIcon, XIcon } from 'lucide-react';
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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // constants and calculations
  const SHIPPING_FEE = 99;
  const GST_RATE = 0.18;

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const base = Number(totalPrice || 0);
    
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      return Number((base * (appliedCoupon.discountValue / 100)).toFixed(2));
    } else if (appliedCoupon.discountType === 'FIXED') {
      return Number(Math.min(appliedCoupon.discountValue, base).toFixed(2));
    }
    return 0;
  }, [totalPrice, appliedCoupon]);

  // Subtotal after discount
  const subtotalAfterDiscount = useMemo(() => {
    return Number((Number(totalPrice || 0) - discountAmount).toFixed(2));
  }, [totalPrice, discountAmount]);

  // GST computed from subtotal after discount
  const gstAmount = useMemo(() => {
    return Number((subtotalAfterDiscount * GST_RATE).toFixed(2));
  }, [subtotalAfterDiscount]);

  const finalTotal = useMemo(() => {
    const tot = subtotalAfterDiscount + Number(gstAmount || 0) + Number(SHIPPING_FEE || 0);
    return Number(tot.toFixed(2));
  }, [subtotalAfterDiscount, gstAmount]);

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code', { position: 'bottom-center' });
      return;
    }

    try {
      setCouponLoading(true);
      const token = await getToken();
      
      const { data } = await axios.post('/api/coupon/validate', 
        { 
          code: couponCode.trim().toUpperCase(),
          subtotal: Number(totalPrice || 0)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.ok && data?.coupon) {
        setAppliedCoupon(data.coupon);
        toast.success(`Coupon applied! You saved ${currency}${discountAmount}`, { 
          position: 'top-center' 
        });
      } else {
        toast.error(data?.error || 'Invalid coupon code', { position: 'bottom-center' });
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast.error(
        error?.response?.data?.error || 'Failed to apply coupon', 
        { position: 'top-center' }
      );
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove Coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed', { position: 'bottom-center' });
  };

  // Helper: show success toast (mobile-friendly) and redirect to home
  const handleSuccessRedirect = (orderId) => {
    toast.success('Order placed — thank you!', {
      position: 'top-center',
      duration: 3500,
    });

    // refresh cart in background
    try {
      dispatch(fetchCart({ getToken }));
    } catch (e) {
      // ignore
    }

    // short delay so user sees toast, then redirect to home
    setTimeout(() => {
      try {
        router.push('/');
      } catch {
        window.location.href = '/';
      }
    }, 800);
  };

  // Place order with coupon support
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        toast('Please login to place an order', { position: 'bottom-center' });
        return;
      }
      if (!selectedAddress) {
        toast('Please select an address', { position: 'bottom-center' });
        return;
      }

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
        gstAmount: Number(gstAmount.toFixed(2)),
        shipping: Number(SHIPPING_FEE.toFixed(2)),
        total: Number(finalTotal.toFixed(2)),
        couponCode: appliedCoupon?.code || null,
        discount: appliedCoupon ? Number(discountAmount.toFixed(2)) : 0,
      };

      console.log('ORDER DATA SENT ===>', JSON.stringify(orderData, null, 2));

      const { data } = await axios.post('/api/order/create', orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!data) throw new Error('No response from server');

      // ===== Razorpay flow (server already returned razorpayOrderId etc) =====
      if (paymentMethod === 'RAZORPAY') {
        const { razorpayOrderId, amount, currency, keyId, order: createdOrder } = data;

        if (!razorpayOrderId) {
          toast.error(data?.error || 'Payment initialization failed', { position: 'bottom-center' });
          return;
        }

        if (!window.Razorpay) {
          toast.error(
            'Razorpay SDK missing. Add <script src="https://checkout.razorpay.com/v1/checkout.js"></script> to your layout.',
            { position: 'bottom-center' }
          );
          return;
        }

        const options = {
          key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount,
          currency,
          order_id: razorpayOrderId,
          name: 'Mooi Professional',
          description: 'Order Payment',
          handler: async function (resp) {
            try {
              setLoading(true);
              const token2 = await getToken();
              const verify = await axios.post('/api/order/confirm', {
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                orderId: createdOrder?.id ?? (data.order?.id ?? undefined),
              }, { headers: { Authorization: `Bearer ${token2}` } });

              if (verify.data?.ok) {
                toast.success('Payment successful', { position: 'bottom-center' });
                try { dispatch(fetchCart({ getToken })); } catch {}
                handleSuccessRedirect(verify.data.order?.id ?? createdOrder?.id ?? '');
              } else {
                toast.error(verify.data?.error || 'Payment verification failed', { position: 'bottom-center' });
              }
            } catch (err) {
              console.error('Razorpay verify err', err);
              toast.error(err?.response?.data?.error || err.message || 'Verification failed', { position: 'bottom-center' });
            } finally {
              setLoading(false);
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

      // ===== COD flow — server creates order and clears cart =====
      if (data?.ok) {
        toast.success(data.message || 'Order placed successfully', { position: 'bottom-center' });
        try { dispatch(fetchCart({ getToken })); } catch {}
        const orderId = data.order?.id ?? (Array.isArray(data.orders) ? data.orders[0]?.id : undefined) ?? '';
        handleSuccessRedirect(orderId);
      } else {
        throw new Error(data?.error || 'Order creation failed');
      }
    } catch (error) {
      console.error('handlePlaceOrder error:', error);
      toast.error(error?.response?.data?.error || error.message || 'Failed to place order', { position: 'bottom-center' });
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
        <label htmlFor="COD" className="cursor-pointer">Cash On Delivery</label>
      </div>
      <div className="flex gap-2 items-center mt-1">
        <input type="radio" id="RAZORPAY" name="payment" onChange={() => setPaymentMethod('RAZORPAY')} checked={paymentMethod === 'RAZORPAY'} className="accent-gray-500" />
        <label htmlFor="RAZORPAY" className="cursor-pointer">RAZORPAY Payment</label>
      </div>

      {/* Coupon Section */}
      <div className="my-4 py-4 border-y border-slate-200">
        <p className="text-slate-400 mb-2">Have a Coupon?</p>
        
        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TagIcon size={16} className="text-green-600" />
              <div>
                <p className="text-green-700 font-medium text-sm">{appliedCoupon.code}</p>
                <p className="text-green-600 text-xs">
                  Saved {currency}{discountAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-500 hover:text-red-700 transition-colors"
              aria-label="Remove coupon"
            >
              <XIcon size={18} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-slate-500 transition-colors"
              disabled={couponLoading}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {couponLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}
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
            {appliedCoupon && <p className="text-green-600">Discount:</p>}
            <p>Shipping:</p>
            <p>GST (18%):</p>
          </div>
          <div className="flex flex-col gap-1 font-medium text-right">
            <p>{currency}{Number(totalPrice || 0).toLocaleString()}</p>
            {appliedCoupon && (
              <p className="text-green-600">-{currency}{discountAmount.toFixed(2)}</p>
            )}
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