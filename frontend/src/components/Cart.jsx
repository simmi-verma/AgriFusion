import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Trash2, ShoppingBag, ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';
import { useToast } from './Toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function Cart({ user }) {
  const toast = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (err) {
      console.error(err);
      setError('Could not load shopping cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const handleRemove = async (productId) => {
    if (!cart) return;

    // Backup current cart
    const previousCart = { ...cart };

    // Optimistically update UI state
    const filteredItems = cart.items.filter(item => item.product?._id !== productId);
    setCart({ ...cart, items: filteredItems });

    const toastId = toast.success('Removed item from cart.');

    try {
      const response = await api.post(`/cart/remove/${productId}`);
      setCart(response.data);
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Failed to sync changes with server. Reverting...');
      // Revert to backup on failure
      setCart(previousCart);
      setError('Failed to remove item.');
    }
  };

  const handleCheckout = () => {
    setError(null);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    setError(null);
    setLoading(true);
    const toastId = toast.loading('Confirming transaction and clearing order...');
    try {
      await api.post('/cart/buy', { paymentIntentId });
      setOrderSuccess(true);
      setCart({ items: [] });
      toast.dismiss(toastId);
      toast.success('Order placed successfully!');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(err.response?.data?.error || 'Order placement failed.');
      setError(err.response?.data?.error || 'Order placement failed.');
    } finally {
      setLoading(false);
      setShowCheckout(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex-grow flex items-center justify-center py-16 px-4 bg-green-50">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-md w-full text-center border border-green-100">
          <div className="bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-3xl font-extrabold text-green-950 mb-2">Order Placed!</h2>
          <p className="text-gray-600 text-sm mb-8">
            Thank you for purchasing direct from local farms. Your order has been registered successfully.
          </p>
          <Link 
            to="/products" 
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition shadow-md"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const totalPrice = items.reduce((sum, item) => sum + (item.product?.sellingPrice || 0) * item.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 w-full flex-grow">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/products" className="text-green-700 hover:text-green-800 flex items-center gap-1 text-sm font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold text-green-950 mb-8 flex items-center gap-2">
        Your Shopping Cart
      </h1>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          {/* Cart List Skeletons */}
          <div className="lg:col-span-2 space-y-4">
            {[...Array(2)].map((_, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-green-50 shadow-sm flex items-center justify-between gap-4">
                <div className="flex gap-4 items-center flex-grow">
                  <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0"></div>
                  <div className="space-y-2 flex-grow">
                    <div className="h-4 bg-gray-200 rounded-lg w-1/3"></div>
                    <div className="h-3 bg-gray-150 rounded-lg w-1/4"></div>
                    <div className="h-3 bg-gray-150 rounded-lg w-1/5"></div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              </div>
            ))}
          </div>
          {/* Summary Skeleton */}
          <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-md h-48 space-y-4">
            <div className="h-5 bg-gray-200 rounded-lg w-1/2 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-150 rounded-lg w-full"></div>
              <div className="h-3 bg-gray-150 rounded-lg w-full"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded-xl w-full pt-4"></div>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center max-w-xl mx-auto">
          <svg className="w-48 h-48 text-green-200 mb-6" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#f0fdf4" />
            <path d="M60 70H140M60 70L70 140H130L140 70M60 70L50 50H30" stroke="#86efac" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="85" cy="160" r="10" fill="#22c55e" />
            <circle cx="115" cy="160" r="10" fill="#22c55e" />
            <path d="M90 100C90 100 95 90 100 90C105 90 110 100 110 100" stroke="#15803d" strokeWidth="4" strokeLinecap="round"/>
            <path d="M80 115H120" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <p className="text-gray-500 font-extrabold text-lg mb-2">Your Cart is Empty</p>
          <p className="text-gray-400 text-xs max-w-xs mb-6 leading-relaxed">Looks like you haven't added any fresh farm crops yet. Explore local listings direct from Growers!</p>
          <Link 
            to="/products" 
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md hover:scale-102 inline-block"
          >
            Browse Produce
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item._id} 
                className="bg-white p-5 rounded-2xl border border-green-50 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border">
                    <img 
                      src={item.product?.imageUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=150'} 
                      alt={item.product?.title}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">{item.product?.title}</h3>
                    <p className="text-sm text-green-700 font-semibold mt-0.5">₹{item.product?.sellingPrice}</p>
                    <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemove(item.product?._id)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Checkout Summary */}
          <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-md h-fit">
            <h3 className="text-lg font-bold text-green-950 mb-4 pb-2 border-b border-gray-100">Order Summary</h3>
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Direct Delivery fee</span>
                <span>FREE</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold text-green-950">
                <span>Grand Total</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition shadow-md flex justify-center items-center gap-2 text-base"
            >
              <ShoppingBag className="w-5 h-5" /> Place Order (Buy All)
            </button>
            <div className="mt-4 text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
              <Info className="w-3.5 h-3.5" /> Direct settlement: 100% of price is wired directly to growers.
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              totalPrice={totalPrice} 
              onPaymentSuccess={handlePaymentSuccess} 
              onCancel={() => setShowCheckout(false)} 
            />
          </Elements>
        </div>
      )}
    </div>
  );
}
