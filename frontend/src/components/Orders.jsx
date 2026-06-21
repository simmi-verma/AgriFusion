import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Clock, User, CheckCircle } from 'lucide-react';

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const endpoint = user.role === 'farmer' ? '/orders/farmer' : '/orders';
        const response = await api.get(endpoint);
        setOrders(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load transaction records.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 w-full flex-grow">
      <div className="flex items-center gap-2 mb-6">
        <Link to="/dashboard" className="text-green-700 hover:text-green-800 flex items-center gap-1 text-sm font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold text-green-955 mb-2 flex items-center gap-2">
        {user?.role === 'farmer' ? 'Crop Sales Records' : 'Your Order History'}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        {user?.role === 'farmer' 
          ? 'Track purchases of your listed crops and coordinate delivery settlements.' 
          : 'Review your direct purchases and coordinate with local growers.'
        }
      </p>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 md:p-8 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-lg w-32"></div>
                  <div className="h-3 bg-gray-150 rounded-lg w-24"></div>
                </div>
                <div className="space-y-2 flex flex-col items-end">
                  <div className="h-3 bg-gray-150 rounded-lg w-12"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-20"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={order._id} 
                className="bg-white rounded-3xl border border-green-100 shadow-md hover:shadow-lg transition-all p-6 md:p-8"
              >
                {/* Order Meta Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100 mb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-bold">
                        ORDER ID: {order._id.slice(-8).toUpperCase()}
                      </span>
                      {order.paymentStatus === 'paid' ? (
                        <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" /> Paid (Stripe)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Payment
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {formattedDate}
                      </div>
                      {order.stripePaymentIntentId && (
                        <div className="text-[10px] font-mono text-gray-400 select-all">
                          Tx ID: {order.stripePaymentIntentId}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 font-medium">Total Settlement</span>
                    <span className="text-2xl font-black text-green-700">₹{order.totalAmount}</span>
                  </div>
                </div>

                {/* Customer Details for Farmers */}
                {user.role === 'farmer' && order.customerId && (
                  <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100/50 mb-6 flex gap-3 items-center">
                    <div className="bg-green-100 text-green-700 p-2 rounded-xl">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-green-900">Buyer Details</div>
                      <div className="text-gray-600 mt-0.5">{order.customerId.name} ({order.customerId.email})</div>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-2">Purchased Items</h4>
                  {order.items.map((item, idx) => {
                    if (!item.product) return null;
                    return (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center bg-gray-50/50 p-3.5 rounded-xl border border-gray-100/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border flex-shrink-0">
                            <img 
                              src={item.product.imageUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=150'} 
                              alt={item.product.title}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-sm">{item.product.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">₹{item.product.sellingPrice} each</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                          <div className="font-semibold text-green-800 text-sm mt-0.5">
                            ₹{item.product.sellingPrice * item.quantity}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivery Settlements Tag */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="text-[10px] text-gray-400 italic flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Settled and cleared on blockchain standard
                  </div>
                  {user.role === 'customer' && order.items[0]?.product?.createdBy && (
                    <Link
                      to={`/chat/${order.items[0].product.createdBy._id || order.items[0].product.createdBy}`}
                      className="bg-white hover:bg-gray-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      Coordinate Delivery
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-md mx-auto flex flex-col items-center">
          <svg className="w-48 h-48 text-green-200 mb-6" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#f0fdf4" />
            <rect x="65" y="55" width="70" height="90" rx="8" stroke="#86efac" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M80 80H120" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            <path d="M80 100H120" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            <path d="M80 120H105" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            <circle cx="140" cy="140" r="22" fill="#15803d" />
            <path d="M135 140L138 143L145 136" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-gray-500 font-extrabold text-lg mb-2">No Orders Yet</p>
          <p className="text-gray-400 text-xs max-w-xs mb-6 leading-relaxed">You haven't placed or received any orders on AgroFusion yet. Head over to the products tab to get started!</p>
          <Link 
            to="/products" 
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md hover:scale-102"
          >
            Browse Marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
