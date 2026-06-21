import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, AlertCircle, RefreshCw, X } from 'lucide-react';
import api from '../api';

export default function CheckoutForm({ totalPrice, onPaymentSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // 1. Create PaymentIntent on the backend
      const { data } = await api.post('/payment/create-payment-intent');
      const clientSecret = data.clientSecret;

      // 2. Confirm the payment on the frontend using CardElement
      const cardElement = elements.getElement(CardElement);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          onPaymentSuccess(result.paymentIntent.id);
        }
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setError(err.response?.data?.error || 'Failed to initiate secure checkout session.');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: '#1f2937', // gray-800
        fontFamily: '"Outfit", "Inter", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#9ca3af', // gray-400
        },
      },
      invalid: {
        color: '#dc2626', // red-600
        iconColor: '#dc2626',
      },
    },
  };

  return (
    <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-green-100 shadow-2xl p-6 relative overflow-hidden">
      {/* Premium Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"></div>
      
      <button 
        onClick={onCancel}
        disabled={processing}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition"
        title="Cancel Checkout"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="text-center mt-3 mb-6">
        <div className="inline-flex items-center justify-center bg-green-50 text-green-700 w-12 h-12 rounded-2xl mb-3 border border-green-100">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-green-950">Secure Checkout</h2>
        <p className="text-xs text-gray-500 mt-1">Payment processed securely via Stripe</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Amount Box */}
        <div className="bg-green-50/50 border border-green-100/50 rounded-2xl p-4 flex justify-between items-center">
          <span className="text-sm font-semibold text-green-900">Total Settlement</span>
          <span className="text-xl font-extrabold text-green-700">₹{totalPrice}</span>
        </div>

        {/* Card input field wrapper */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Card Details</label>
          <div className="border border-gray-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100 rounded-xl p-4 bg-white transition duration-200">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {/* Test Card Info banner */}
        <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-3.5 flex gap-2.5 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block mb-0.5">Test Gateway Enabled</span>
            Use <code className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono font-bold">4242 4242 4242 4242</code> with any future expiry and CVV for simulated transactions.
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl flex gap-2 items-start text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Pay Button */}
        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition shadow-md hover:shadow-lg flex justify-center items-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Verifying Payment...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay ₹{totalPrice} & Place Order
            </>
          )}
        </button>
      </form>
    </div>
  );
}
