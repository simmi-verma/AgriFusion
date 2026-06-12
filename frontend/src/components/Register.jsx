import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { User, Mail, Lock, MapPin, AlertCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!role) {
      setError('Please select a role: Farmer or Customer');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        city: role === 'farmer' ? city : undefined,
        state: role === 'farmer' ? state : undefined,
        country: role === 'farmer' ? country : undefined,
        pincode: role === 'farmer' ? pincode : undefined,
      });

      // Redirect to home or login page with success notification
      navigate('/login?message=registered');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Registration failed. Check details and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-16 px-4 bg-green-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-green-100">
        <div className="text-center mb-8">
          <span className="text-4xl">🌾</span>
          <h2 className="text-3xl font-extrabold text-green-955 mt-2">Partner with Us</h2>
          <p className="text-gray-500 text-sm mt-1">Join as a farmer or standard consumer</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm"
              required
            />
          </div>

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

          <div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition text-sm text-gray-600 bg-white"
              required
            >
              <option value="">Select Marketplace Role</option>
              <option value="farmer">Farmer (I grow crops)</option>
              <option value="customer">Customer (I buy products)</option>
            </select>
          </div>

          {/* Conditional location fields for farmers */}
          {role === 'farmer' && (
            <div className="space-y-3 p-4 bg-green-50/50 rounded-2xl border border-green-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-xs font-semibold text-green-800 flex items-center gap-1 mb-2">
                <MapPin className="w-4 h-4" /> FARM LOCATION INFO
              </div>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Pincode"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md disabled:bg-green-400 flex justify-center items-center"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-green-700 hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
