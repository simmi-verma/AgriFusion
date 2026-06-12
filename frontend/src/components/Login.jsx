import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login({ login }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Update local storage and context state
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      login(token, user);
      
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 bg-green-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-green-100">
        <div className="text-center mb-8">
          <span className="text-4xl">🔑</span>
          <h2 className="text-3xl font-extrabold text-green-950 mt-2">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage products and orders</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:bg-green-400 flex justify-center items-center gap-2"
          >
            {loading ? 'Logging In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link to="/register" className="text-green-700 hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
