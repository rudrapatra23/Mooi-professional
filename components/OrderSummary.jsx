// app/components/OrderSummary.jsx
'use client';
import { PlusIcon, SquarePenIcon, TagIcon, XIcon, ChevronDown, Check, MapPin } from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';

// Custom Address Dropdown Component
const AddressDropdown = ({ addressList, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (address, index) => {
    setSelected(index);
    onSelect(address);
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-black p-4 text-sm font-medium uppercase tracking-wide bg-white hover:bg-gray-50 transition-colors"
      >
        <span className={selected !== null ? "text-black" : "text-gray-400"}>
          {selected !== null
            ? `${addressList[selected].name}, ${addressList[selected].city}`
            : "Select Saved Address"
          }
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-black border-t-0 shadow-lg max-h-64 overflow-y-auto">
          {addressList.map((address, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(address, index)}
              className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${selected === index ? 'bg-gray-50' : ''
                }`}
            >
              <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm uppercase tracking-wide text-black truncate">
                  {address.name}
                </p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {address.street}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {address.city}, {address.state} {address.zip}
                </p>
              </div>
              {selected === index && (
                <Check size={16} className="flex-shrink-0 text-black mt-0.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


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
  const FREE_SHIPPING_THRESHOLD = 1599;
  const GST_RATE = 0.18;

  // Free delivery for orders over ₹1599
  const isFreeShipping = Number(totalPrice || 0) >= FREE_SHIPPING_THRESHOLD;
  const SHIPPING_FEE = isFreeShipping ? 0 : 99;
  const amountForFreeShipping = FREE_SHIPPING_THRESHOLD - Number(totalPrice || 0);

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
                try { dispatch(fetchCart({ getToken })); } catch { }
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
        try { dispatch(fetchCart({ getToken })); } catch { }
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
    <div className="w-full bg-white text-black p-0 mt-8 lg:mt-0">
      <div className="border border-black p-5 sm:p-8">
        <h2 className="text-xl font-serif font-bold uppercase tracking-widest text-black mb-8 border-b border-black/10 pb-4">
          Order Summary
        </h2>

        {/* Payment Method */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Payment Method</p>
          <div className="flex flex-col gap-3">
            <label className={`flex items-center gap-3 p-4 border transition-all cursor-pointer ${paymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
              <input type="radio" name="payment" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className="accent-black w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wide">Cash On Delivery</span>
            </label>
            <label className={`flex items-center gap-3 p-4 border transition-all cursor-pointer ${paymentMethod === 'RAZORPAY' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}>
              <input type="radio" name="payment" onChange={() => setPaymentMethod('RAZORPAY')} checked={paymentMethod === 'RAZORPAY'} className="accent-black w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wide">Pay Online (Razorpay)</span>
            </label>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="mb-8 pb-8 border-b border-black/10">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Promo Code</p>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-black text-white p-4">
              <div className="flex items-center gap-3">
                <TagIcon size={16} className="text-white" />
                <div>
                  <p className="font-bold text-sm uppercase tracking-wider">{appliedCoupon.code}</p>
                  <p className="text-[10px] uppercase tracking-wide opacity-80">
                    Saved {currency}{discountAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Remove coupon"
              >
                <XIcon size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="flex-1 min-w-0 border border-black p-3 outline-none text-sm font-bold uppercase tracking-wide placeholder-gray-400 rounded-none bg-white"
                disabled={couponLoading}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:bg-gray-400 transition-all rounded-none whitespace-nowrap flex-shrink-0"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Address Section */}
        <div className="mb-8 pb-8 border-b border-black/10">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Shipping Address</p>
            {selectedAddress && (
              <button onClick={() => setSelectedAddress(null)} className="text-xs font-bold uppercase text-black border-b border-black hover:text-gray-600 transition-colors">
                Change
              </button>
            )}
          </div>

          {selectedAddress ? (
            <div className="border border-gray-200 p-4 bg-gray-50">
              <p className="font-bold text-sm uppercase tracking-wide mb-1">{selectedAddress.name}</p>
              <p className="text-xs text-gray-600 uppercase tracking-wider leading-relaxed">
                {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}
              </p>
            </div>
          ) : (
            <div>
              {addressList.length > 0 && (
                <AddressDropdown
                  addressList={addressList}
                  onSelect={setSelectedAddress}
                />
              )}
              <button
                className="w-full border border-dashed border-gray-400 text-gray-500 hover:text-black hover:border-black p-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all rounded-none"
                onClick={() => setShowAddressModal(true)}
              >
                <PlusIcon size={14} /> Add New Address
              </button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between text-sm uppercase tracking-wider text-gray-500">
            <span>Subtotal</span>
            <span className="text-black font-bold">{currency}{Number(totalPrice || 0).toLocaleString()}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-sm uppercase tracking-wider text-green-700">
              <div className="flex items-center gap-2"><TagIcon size={12} /> <span>Discount</span></div>
              <span className="font-bold">-{currency}{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm uppercase tracking-wider text-gray-500">
            <span>Shipping</span>
            <span className={`font-bold ${isFreeShipping ? 'text-green-600' : 'text-black'}`}>
              {isFreeShipping ? 'FREE' : `${currency}${SHIPPING_FEE}`}
            </span>
          </div>

          {/* Free shipping progress indicator */}
          {!isFreeShipping && amountForFreeShipping > 0 && (
            <div className="text-xs text-gray-500 mt-2 p-3 bg-gray-50 border border-gray-200">
              Add <span className="font-bold text-black">{currency}{amountForFreeShipping.toFixed(0)}</span> more for <span className="font-bold text-black">FREE delivery</span>
            </div>
          )}

          <div className="flex justify-between text-sm uppercase tracking-wider text-gray-500">
            <span>Tax (GST 18%)</span>
            <span className="text-black font-bold">{currency}{gstAmount.toFixed(2)}</span>
          </div>

          <div className="h-px bg-black w-full my-4"></div>

          <div className="flex justify-between items-end">
            <span className="text-sm font-bold uppercase tracking-widest text-black">Total Amount</span>
            <span className="text-2xl font-serif font-black text-black">{currency}{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={(e) => toast.promise(handlePlaceOrder(e), { loading: 'Processing Order...' })}
          className="w-full bg-black text-white py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-zinc-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all rounded-none"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>

        {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
      </div>
    </div>
  );
};

export default OrderSummary;