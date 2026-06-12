import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { ShoppingBag, PlusCircle, MapPin, Inbox, Info, DollarSign, TrendingUp, ShoppingCart, MessageSquare, List } from 'lucide-react';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    cartCount: 0,
    listingsCount: 0,
    ordersCount: 0,
    financialSum: 0,
    inquiryCount: 0
  });
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (!user) return;

    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        let cartCount = 0;
        let listingsCount = 0;
        let ordersCount = 0;
        let financialSum = 0;
        let inquiryCount = 0;

        // 1. Fetch Cart
        if (user.role === 'customer') {
          try {
            const cartRes = await api.get('/cart');
            cartCount = cartRes.data?.items?.length || 0;
          } catch (e) { console.warn(e); }
        }

        // 2. Fetch Products
        try {
          const prodRes = await api.get('/products');
          const myProducts = prodRes.data.filter(p => 
            p.createdBy && (p.createdBy._id === user.id || p.createdBy === user.id)
          );
          listingsCount = myProducts.length;
        } catch (e) { console.warn(e); }

        // 3. Fetch Orders & Calculate totals
        try {
          const endpoint = user.role === 'farmer' ? '/orders/farmer' : '/orders';
          const orderRes = await api.get(endpoint);
          const orders = orderRes.data || [];
          ordersCount = orders.length;
          financialSum = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        } catch (e) { console.warn(e); }

        // 4. Fetch Inbox conversations
        try {
          const convRes = await api.get('/chat/conversations');
          inquiryCount = convRes.data?.length || 0;
        } catch (e) { console.warn(e); }

        setStats({
          cartCount,
          listingsCount,
          ordersCount,
          financialSum,
          inquiryCount
        });
      } catch (err) {
        console.error('Failed to aggregate dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex-grow flex flex-col max-w-6xl mx-auto py-12 px-6 w-full">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-green-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight">
              Welcome, {user.name}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Role: <strong className="text-green-700 capitalize">{user.role}</strong> | Farm Marketplace Portal
            </p>
          </div>
          <div className="bg-green-50 text-green-800 px-4 py-2 rounded-full font-bold text-xs border border-green-100 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span> DB Online
          </div>
        </div>

        {/* Dynamic Analytics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl h-28 animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Stat 1: Financials */}
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  {user.role === 'farmer' ? 'Gross Sales' : 'Total Spent'}
                </span>
                <h3 className="text-2xl font-black text-green-800 mt-1">₹{stats.financialSum}</h3>
              </div>
              <div className="bg-green-200/50 p-3 rounded-full text-green-800">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 2: Orders Count */}
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Orders Record</span>
                <h3 className="text-2xl font-black text-green-800 mt-1">{stats.ordersCount}</h3>
              </div>
              <div className="bg-green-200/50 p-3 rounded-full text-green-800">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 3: Specific Activity */}
            {user.role === 'farmer' ? (
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Crops Listed</span>
                  <h3 className="text-2xl font-black text-green-800 mt-1">{stats.listingsCount}</h3>
                </div>
                <div className="bg-green-200/50 p-3 rounded-full text-green-800">
                  <List className="w-6 h-6" />
                </div>
              </div>
            ) : (
              <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cart Items</span>
                  <h3 className="text-2xl font-black text-green-800 mt-1">{stats.cartCount}</h3>
                </div>
                <div className="bg-green-200/50 p-3 rounded-full text-green-800">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>
            )}

            {/* Stat 4: Inquiries */}
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Buyer Inquiries</span>
                <h3 className="text-2xl font-black text-green-800 mt-1">{stats.inquiryCount}</h3>
              </div>
              <div className="bg-green-200/50 p-3 rounded-full text-green-800">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Action Blocks */}
        {user.role === 'farmer' ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm flex gap-3 items-center">
              <Info className="w-5 h-5 flex-shrink-0" />
              <span>Use the tools below to submit new listings, verify sales settlements, and chat with customers.</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link 
                to="/products" 
                className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-2xl font-bold flex flex-col justify-between items-start gap-4 transition shadow-md group"
              >
                <PlusCircle className="w-8 h-8 group-hover:scale-105 transition" />
                <div>
                  <div className="text-lg">Add New Product</div>
                  <div className="text-xs font-normal text-green-100 mt-1">List your crops for direct sale</div>
                </div>
              </Link>

              <Link 
                to="/orders" 
                className="bg-white hover:bg-gray-50 text-gray-800 p-6 rounded-2xl font-bold flex flex-col justify-between items-start gap-4 transition border border-gray-200 shadow-sm group"
              >
                <TrendingUp className="w-8 h-8 text-green-700 group-hover:scale-105 transition" />
                <div>
                  <div className="text-lg">Sales Records</div>
                  <div className="text-xs font-normal text-gray-500 mt-1">Check purchases of your crops</div>
                </div>
              </Link>

              <Link 
                to="/inbox" 
                className="bg-white hover:bg-gray-50 text-gray-800 p-6 rounded-2xl font-bold flex flex-col justify-between items-start gap-4 transition border border-gray-200 shadow-sm group"
              >
                <Inbox className="w-8 h-8 text-green-700 group-hover:scale-105 transition" />
                <div>
                  <div className="text-lg">Message Inbox</div>
                  <div className="text-xs font-normal text-gray-500 mt-1">Chat with customers directly</div>
                </div>
              </Link>
            </div>

          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm flex gap-3 items-center">
              <Info className="w-5 h-5 flex-shrink-0" />
              <span>Use the buttons below to browse local products, locate supplier farms, and check order statuses.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link 
                to="/products" 
                className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-2xl font-bold flex flex-col justify-between items-start gap-4 transition shadow-md group"
              >
                <ShoppingBag className="w-8 h-8 group-hover:scale-105 transition" />
                <div>
                  <div className="text-lg">Browse Products</div>
                  <div className="text-xs font-normal text-green-100 mt-1">Purchase directly from growers</div>
                </div>
              </Link>

              <Link 
                to="/nearby" 
                className="bg-white hover:bg-gray-50 text-gray-800 p-6 rounded-2xl font-bold flex flex-col justify-between items-start gap-4 transition border border-gray-200 shadow-sm group"
              >
                <MapPin className="w-8 h-8 text-green-700 group-hover:scale-105 transition" />
                <div>
                  <div className="text-lg">Nearby Farmers</div>
                  <div className="text-xs font-normal text-gray-500 mt-1">Locate farms on Leaflet map</div>
                </div>
              </Link>

              <Link 
                to="/orders" 
                className="bg-white hover:bg-gray-50 text-gray-800 p-6 rounded-2xl font-bold flex flex-col justify-between items-start gap-4 transition border border-gray-200 shadow-sm group"
              >
                <TrendingUp className="w-8 h-8 text-green-700 group-hover:scale-105 transition" />
                <div>
                  <div className="text-lg">Order History</div>
                  <div className="text-xs font-normal text-gray-500 mt-1">Track checkouts & coordinates</div>
                </div>
              </Link>

              <Link 
                to="/cart" 
                className="bg-white hover:bg-gray-50 text-gray-800 p-6 rounded-2xl font-bold flex flex-col justify-between items-start gap-4 transition border border-gray-200 shadow-sm group"
              >
                <ShoppingCart className="w-8 h-8 text-green-700 group-hover:scale-105 transition" />
                <div>
                  <div className="text-lg">Your Cart</div>
                  <div className="text-xs font-normal text-gray-500 mt-1">Manage selected purchases</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
