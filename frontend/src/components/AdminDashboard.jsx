import React, { useState, useEffect } from 'react';
import api from '../api';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ShieldAlert, Users, TrendingUp, AlertCircle, CheckCircle, Ban, UserCheck, Inbox, Map, Activity, Send, BarChart2, Sprout, ShoppingBag } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const STATE_COORDINATES = {
  'Uttar Pradesh': [26.8467, 80.9462],
  'Maharashtra': [19.7515, 75.7139],
  'Gujarat': [22.2587, 71.1924],
  'Haryana': [29.0588, 76.0856],
  'Andhra Pradesh': [15.9129, 79.7400],
  'Jharkhand': [23.6102, 85.2799],
  'Odisha': [20.9517, 85.0985],
  'Karnataka': [15.3173, 75.7139],
  'Bihar': [25.0961, 85.3131],
  'Rajasthan': [27.0238, 74.2179],
  'Telangana': [18.1124, 79.0193],
  'West Bengal': [22.9868, 87.8550],
  'Kerala': [10.8505, 76.2711],
  'Tamil Nadu': [11.1271, 78.6569],
  'Madhya Pradesh': [22.9734, 78.6569],
  'Assam': [26.2006, 92.9376],
  'Punjab': [31.1471, 75.3412]
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dispute chat input
  const [disputeMessage, setDisputeMessage] = useState({});

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, disputesRes, productsRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users'),
        api.get('/admin/disputes'),
        api.get('/products')
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
      setDisputes(disputesRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error(err);
      setError('Access denied or failed to retrieve administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleSuspend = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/suspend`);
      fetchAdminData();
    } catch (e) {
      alert('Failed to update suspension status.');
    }
  };

  const handleToggleVerifyFarmer = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/verify-farmer`);
      fetchAdminData();
    } catch (e) {
      alert('Failed to update farmer credentials verification.');
    }
  };

  const handleResolveDispute = async (disputeId) => {
    try {
      await api.post(`/admin/disputes/${disputeId}/resolve`);
      fetchAdminData();
    } catch (e) {
      alert('Failed to resolve dispute.');
    }
  };

  const handleSendDisputeMessage = async (disputeId) => {
    const text = disputeMessage[disputeId];
    if (!text || !text.trim()) return;

    try {
      await api.post(`/admin/disputes/${disputeId}/message`, { message: text });
      setDisputeMessage(prev => ({ ...prev, [disputeId]: '' }));
      fetchAdminData();
    } catch (e) {
      alert('Failed to send message.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product listing? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${productId}`);
      alert('Product listing deleted successfully.');
      fetchAdminData();
    } catch (e) {
      alert('Failed to delete product.');
    }
  };

  // Compile coordinates for heatmap display based on order customer location
  const getMapDensityData = () => {
    if (!analytics || !analytics.orders) return [];
    const stateDensity = {};

    analytics.orders.forEach(order => {
      // Find state of customer
      const state = order.customerId?.location?.state;
      if (state && STATE_COORDINATES[state]) {
        stateDensity[state] = (stateDensity[state] || 0) + (order.totalAmount || 0);
      }
    });

    return Object.keys(stateDensity).map(state => ({
      name: state,
      coordinates: STATE_COORDINATES[state],
      volume: stateDensity[state],
      radius: Math.min(Math.max(stateDensity[state] / 500, 10), 30) // dynamic radius sizes
    }));
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center py-20 text-green-700 bg-green-50">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-lg">Loading Superuser Terminal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 bg-green-50">
        <div className="bg-white p-8 rounded-3xl border border-red-200 text-center max-w-md shadow-lg">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unauthorized Access</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
        </div>
      </div>
    );
  }

  // Chart Setup for Listings count over time
  const listingsChartData = {
    labels: analytics?.cropListingsOverTime?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Crops Enlisted',
        data: analytics?.cropListingsOverTime?.map(item => item.count) || [],
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.2)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow flex flex-col">
      {/* Title */}
      <div className="flex justify-between items-center mb-8 border-b border-green-100 pb-4">
        <div>
          <h1 className="text-3xl font-black text-green-955 flex items-center gap-2">
            Admin Superuser Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Platform analytics, user controls, dispute resolution logs</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-4 scrollbar-none">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'analytics' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Analytics & Charts
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'users' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> User Management
        </button>
        <button
          onClick={() => setActiveTab('crops')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'crops' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sprout className="w-4 h-4" /> Crop Registry
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'transactions' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Transaction Logs
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'disputes' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox className="w-4 h-4" /> Dispute Resolution Panel
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-all ${
            activeTab === 'heatmap' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Map className="w-4 h-4" /> Sales Distribution Map
        </button>
      </div>

      {/* Content panes */}
      <div className="flex-grow flex flex-col">
        {/* Tab 1: Analytics & Charts */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Metric Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-green-50 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Revenue</span>
                  <h3 className="text-3xl font-black text-green-800 mt-1">₹{analytics.totalRevenue}</h3>
                </div>
                <div className="bg-green-100 text-green-700 p-3.5 rounded-full">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-green-50 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Farmers Active</span>
                  <h3 className="text-3xl font-black text-green-800 mt-1">{analytics.userCounts.farmer || 0}</h3>
                </div>
                <div className="bg-green-100 text-green-700 p-3.5 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-green-50 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Customers Active</span>
                  <h3 className="text-3xl font-black text-green-800 mt-1">{analytics.userCounts.customer || 0}</h3>
                </div>
                <div className="bg-green-100 text-green-700 p-3.5 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-green-50 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Active Disputes</span>
                  <h3 className="text-3xl font-black text-red-800 mt-1">
                    {disputes.filter(d => d.status === 'pending').length}
                  </h3>
                </div>
                <div className="bg-red-50 text-red-700 p-3.5 rounded-full">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-md">
              <h3 className="text-lg font-bold text-green-955 mb-4">Crop Listings Over Time</h3>
              <div className="h-80 w-full">
                <Line 
                  data={listingsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Control Management */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-green-50 shadow-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-green-955">Registered Partner Directory</h3>
              <p className="text-xs text-gray-500 mt-0.5">Suspend users or update verified farmer badges.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-green-50/20 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{u.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'farmer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {u.location?.city ? `${u.location.city}, ${u.location.state}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'farmer' ? (
                          u.isVerifiedFarmer ? (
                            <span className="text-[10px] text-green-800 bg-green-200/50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-bold w-fit inline-block">
                              Unverified
                            </span>
                          )
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {u.role !== 'admin' && (
                          <>
                            {u.role === 'farmer' && (
                              <button
                                onClick={() => handleToggleVerifyFarmer(u._id)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                                  u.isVerifiedFarmer 
                                    ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50' 
                                    : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                                }`}
                              >
                                <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                                {u.isVerifiedFarmer ? 'Revoke Verification' : 'Verify'}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleToggleSuspend(u._id)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                                u.isSuspended 
                                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                                  : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5 inline mr-1" />
                              {u.isSuspended ? 'Lift Suspension' : 'Suspend'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Dispute complaints resolution panel */}
        {activeTab === 'disputes' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {disputes.length > 0 ? (
              disputes.map(dispute => (
                <div 
                  key={dispute._id} 
                  className="bg-white rounded-3xl border border-green-50 shadow-md p-6 md:p-8"
                >
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                    <div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        dispute.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Status: {dispute.status.toUpperCase()}
                      </span>
                      <h4 className="text-base font-bold text-gray-800 mt-2">Reason: {dispute.reason}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Disputed Order: {dispute.orderId?._id?.slice(-8).toUpperCase() || 'N/A'} | Customer: {dispute.customerId?.name} vs Farmer: {dispute.farmerId?.name}
                      </p>
                    </div>

                    {dispute.status === 'pending' && (
                      <button
                        onClick={() => handleResolveDispute(dispute._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  {/* Complaint messages log */}
                  <div className="bg-gray-50 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-3 mb-4">
                    {dispute.complaints?.map((msg, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-bold text-green-900 capitalize">{msg.sender?.name || 'Admin'} ({msg.sender?.role || 'admin'}):</span>
                        <p className="bg-white p-2 rounded-lg mt-1 border border-gray-100 text-gray-700">{msg.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reply Form */}
                  {dispute.status === 'pending' && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Post admin advisory warning..."
                        value={disputeMessage[dispute._id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDisputeMessage(prev => ({ ...prev, [dispute._id]: val }));
                        }}
                        className="flex-grow border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => handleSendDisputeMessage(dispute._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Send className="w-3.5 h-3.5" /> Post
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">No active dispute files lodged.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Sales Heatmap */}
        {activeTab === 'heatmap' && analytics && (
          <div className="bg-white rounded-3xl border border-green-50 shadow-md p-6 animate-in fade-in duration-200 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-green-955 mb-2 flex items-center gap-1">
              <Map className="w-5 h-5 text-green-600" /> Geographic Order Distribution
            </h3>
            <p className="text-xs text-gray-500 mb-4">Density distribution map highlighting order settlement volumes across states.</p>

            <div className="w-full h-[450px] rounded-2xl overflow-hidden border z-10">
              <MapContainer 
                center={[22.9734, 78.6569]} 
                zoom={5} 
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {getMapDensityData().map((state, idx) => (
                  <CircleMarker
                    key={idx}
                    center={state.coordinates}
                    radius={state.radius}
                    fillColor="red"
                    color="#b91c1c"
                    weight={1.5}
                    fillOpacity={0.4}
                  >
                    <Popup>
                      <div className="text-xs font-sans">
                        <div className="font-bold text-red-800">{state.name}</div>
                        <div className="text-gray-600 font-semibold mt-1">Direct Sales: ₹{state.volume}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}

        {/* Tab 5: Crop Listings Registry */}
        {activeTab === 'crops' && (
          <div className="bg-white rounded-3xl border border-green-50 shadow-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-green-955">Marketplace Crops Directory</h3>
              <p className="text-xs text-gray-500 mt-0.5">Moderate and manage all agricultural listings live on the marketplace.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Crop Details</th>
                    <th className="px-6 py-4">Farmer</th>
                    <th className="px-6 py-4">Market Price</th>
                    <th className="px-6 py-4">Selling Price</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-green-50/20 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{p.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-md">{p.description}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        {p.createdBy?.name || 'Unknown Farmer'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 line-through">
                        ₹{p.currentMarketPrice}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-green-700">
                        ₹{p.sellingPrice}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => window.open(`/products/edit/${p._id}`, '_blank')}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Transaction Logs */}
        {activeTab === 'transactions' && analytics && (
          <div className="bg-white rounded-3xl border border-green-50 shadow-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-green-955">Marketplace Transactions Registry</h3>
              <p className="text-xs text-gray-500 mt-0.5">Audit order transactions, payment settlements, and customer-farmer splits.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Items / Farmer</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(analytics.orders || []).map(order => (
                    <tr key={order._id} className="hover:bg-green-50/20 transition">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-gray-800">
                        {order._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{order.customerId?.name || 'Guest User'}</div>
                        <div className="text-xs text-gray-400">{order.customerId?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-semibold">{item.product?.title || 'Unknown Crop'}</span> x {item.quantity} 
                              <span className="text-gray-400 ml-1">
                                (by {item.product?.createdBy?.name || 'Farmer'})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-green-700">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          order.status === 'completed' || order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
