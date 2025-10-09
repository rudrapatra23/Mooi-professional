import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';

const OrderSummary = ({ totalPrice, items }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
  const router = useRouter();

  const addressList = useSelector(state => state.address.list);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [coupon, setCoupon] = useState('');

  const SHIPPING_CHARGE = 5;
  const GST_RATE = 0.18;

  const gstAmount = useMemo(() => totalPrice * GST_RATE, [totalPrice]);
  const payable = useMemo(() => totalPrice + SHIPPING_CHARGE + gstAmount, [totalPrice, gstAmount]);

  const handleCouponCode = async (event) => {
    event.preventDefault();
    try {
      if (!user) return toast('Please login to proceed');
      const token = await getToken();
      const { data } = await axios.post('/api/coupon', { code: couponCodeInput }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupon(data.coupon);
      toast.success('Coupon Applied');
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      if (!user) return toast('Please login to place an order');
      if (!selectedAddress) return toast('Please select an address');

      const token = await getToken();
      const orderData = {
        addressId: selectedAddress.id,
        items,
        paymentMethod,
        shipping: SHIPPING_CHARGE,
        gst: gstAmount,
        total: payable,
      };

      if (coupon) orderData.couponCode = coupon.code;

      const { data } = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (paymentMethod === 'RAZORPAY') {
        window.location.href = data.session.url;
      } else {
        toast.success(data.message);
        router.push('/orders');
        dispatch(fetchCart({ getToken }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-600 text-sm rounded-xl p-7">
      <h2 className="text-xl font-medium text-slate-700 mb-4">Payment Summary</h2>

      {/* Payment Method */}
      <div className="mb-4">
        <p className="text-slate-400 text-xs mb-2">Payment Method</p>
        <div className="flex gap-2 items-center mb-1">
          <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className="accent-gray-500" />
          <label htmlFor="COD" className="cursor-pointer">COD</label>
        </div>
        <div className="flex gap-2 items-center">
          <input type="radio" id="RAZORPAY" name="payment" onChange={() => setPaymentMethod('RAZORPAY')} checked={paymentMethod === 'RAZORPAY'} className="accent-gray-500" />
          <label htmlFor="RAZORPAY" className="cursor-pointer">RAZORPAY Payment</label>
        </div>
      </div>

      {/* Address Section */}
      <div className="my-4 py-3 border-y border-slate-200">
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
                  <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                ))}
              </select>
            )}
            <button className="flex items-center gap-1 text-slate-600 mt-1" onClick={() => setShowAddressModal(true)}>
              Add Address <PlusIcon size={18} />
            </button>
          </div>
        )}
      </div>

      {/* ✅ Summary Section */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex justify-between mb-1">
          <p>Subtotal:</p>
          <p>{currency}{totalPrice.toFixed(2)}</p>
        </div>
        <div className="flex justify-between mb-1">
          <p>Shipping:</p>
          <p>{currency}{SHIPPING_CHARGE.toFixed(2)}</p>
        </div>
        <div className="flex justify-between mb-1">
          <p>GST (18%):</p>
          <p>{currency}{gstAmount.toFixed(2)}</p>
        </div>
        <div className="flex justify-between font-semibold text-slate-800 border-t mt-2 pt-2">
          <p>Payable:</p>
          <p>{currency}{payable.toFixed(2)}</p>
        </div>
      </div>

      <button onClick={(e) => toast.promise(handlePlaceOrder(e), { loading: 'Placing order...' })} className="w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 mt-4 transition-all">
        Place Order
      </button>

      {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
    </div>
  );
};

export default OrderSummary;
