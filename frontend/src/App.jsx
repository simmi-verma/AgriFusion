import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Cart from './components/Cart';
import NearbyFarmersMap from './components/NearbyFarmersMap';
import Inbox from './components/Inbox';
import Chat from './components/Chat';
import About from './components/About';
import Orders from './components/Orders';
import AdminDashboard from './components/AdminDashboard';
import EditProduct from './components/EditProduct';
import MyProducts from './components/MyProducts';
import api from './api';
import { ToastProvider } from './components/Toast';
import OnboardingTour from './components/OnboardingTour';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user details on load if token is available
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        if (userData && !userData.id) {
          userData.id = userData._id;
        }
        setUser(userData);
      } catch (err) {
        console.error('Failed to load profile:', err);
        // Clean up stale token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on backend:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex flex-col justify-center items-center text-green-700">
        <span className="text-5xl animate-bounce">🌾</span>
        <p className="mt-4 font-bold text-lg">Waking up AgriFusion...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <OnboardingTour />
        <Layout user={user} logout={logout}>
          <Routes>
            <Route path="/" element={<Home user={user} />} />
            <Route path="/login" element={!user ? <Login login={login} /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/about" element={<About />} />
            <Route path="/nearby" element={<NearbyFarmersMap />} />
            <Route path="/products" element={<Products user={user} />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/cart" element={user && user.role === 'customer' ? <Cart user={user} /> : <Navigate to="/login" />} />
            <Route path="/inbox" element={user ? <Inbox user={user} /> : <Navigate to="/login" />} />
            <Route path="/chat/:otherParticipantId" element={user ? <Chat user={user} /> : <Navigate to="/login" />} />
            <Route path="/orders" element={user ? <Orders user={user} /> : <Navigate to="/login" />} />
            <Route path="/products/edit/:id" element={user && user.role === 'farmer' ? <EditProduct user={user} /> : <Navigate to="/login" />} />
            <Route path="/my-products" element={user && user.role === 'farmer' ? <MyProducts user={user} /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user && user.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
  
            {/* Catch All redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </ToastProvider>
  );
}
