import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, User as UserIcon, LogOut, ChevronUp, Send, HelpCircle, 
  Mail, Phone, MapPin, Leaf, ArrowRight, Clock 
} from 'lucide-react';
import api from '../api';
import { useToast } from './Toast';

export default function Layout({ children, user, logout }) {
  const [email, setEmail] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  return (
    <div className="bg-green-50 min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-green-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-green-700 hover:text-green-800 transition">
            AgriFusion
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            <Link to="/" className="text-gray-600 hover:text-green-700 font-medium transition">Home</Link>
            <Link id="nav-products" to="/products" className="text-gray-600 hover:text-green-700 font-medium transition">Products</Link>
            <Link to="/about" className="text-gray-600 hover:text-green-700 font-medium transition">About</Link>
            <Link id="nav-nearby" to="/nearby" className="text-gray-600 hover:text-green-700 font-medium transition">Nearby Farmers</Link>

            {user && (
              <Link to="/orders" className="text-gray-600 hover:text-green-700 font-medium transition">Orders</Link>
            )}

            {user && user.role === 'admin' && (
              <Link to="/admin" className="text-gray-600 hover:text-green-700 font-semibold transition">Admin</Link>
            )}

            {user && user.role === 'farmer' && (
              <Link to="/inbox" className="flex items-center gap-1 text-gray-600 hover:text-green-700 font-medium transition">
                <MessageSquare className="w-4 h-4" /> Messages
              </Link>
            )}

            {user ? (
              <div className="relative pl-4 border-l border-gray-200">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-green-800 font-semibold hover:text-green-700 transition focus:outline-none py-1.5 px-3 rounded-xl hover:bg-green-50/50"
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user.name}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsProfileOpen(false)}></div>
                    
                    {/* Options Card */}
                    <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-3xl border border-green-100 shadow-xl py-4 px-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200 text-left">
                      <div className="pb-3.5 border-b border-gray-100 mb-2.5">
                        <div className="text-sm font-extrabold text-green-950 truncate">{user.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{user.email}</div>
                        <span className="inline-block mt-2 text-[9px] bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-green-700 py-2 px-2.5 rounded-lg hover:bg-green-50/50 transition font-bold"
                        >
                          My Dashboard
                        </Link>
                        {user.role === 'farmer' && (
                          <Link
                            to="/my-products"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-green-700 py-2 px-2.5 rounded-lg hover:bg-green-50/50 transition font-bold"
                          >
                            My Listed Crops
                          </Link>
                        )}
                        {user.role === 'customer' && (
                          <Link
                            to="/cart"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-green-700 py-2 px-2.5 rounded-lg hover:bg-green-50/50 transition font-bold"
                          >
                            Shopping Cart
                          </Link>
                        )}
                        <Link
                          to="/orders"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-green-700 py-2 px-2.5 rounded-lg hover:bg-green-50/50 transition font-bold"
                        >
                          {user.role === 'farmer' ? 'Crop Sales Ledger' : 'Order History'}
                        </Link>
                        <Link
                          to="/inbox"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-green-700 py-2 px-2.5 rounded-lg hover:bg-green-50/50 transition font-bold"
                        >
                          Negotiation Messages
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-2.5 text-xs text-gray-700 hover:text-green-700 py-2 px-2.5 rounded-lg hover:bg-green-50/50 transition font-bold"
                          >
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-2.5 mt-2.5">
                        <button
                          onClick={(e) => {
                            setIsProfileOpen(false);
                            handleLogout(e);
                          }}
                          className="w-full flex items-center gap-2.5 text-xs text-red-600 hover:text-red-700 py-2 px-2.5 rounded-lg hover:bg-red-50/50 transition font-extrabold"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex gap-3 items-center pl-4 border-l border-gray-200">
                <Link to="/login" className="text-gray-600 hover:text-green-700 font-medium transition">Login</Link>
                <Link to="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition shadow-sm">Sign Up</Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-green-700 hover:bg-green-50 focus:outline-none transition duration-150 ease-in-out"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-green-100 shadow-lg px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top duration-200 z-30 relative">
          <div className="flex flex-col gap-3.5">
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-green-700 font-medium py-1.5 px-3 rounded-lg hover:bg-green-50/50 transition"
            >
              Home
            </Link>
            <Link 
              to="/products" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-green-700 font-medium py-1.5 px-3 rounded-lg hover:bg-green-50/50 transition"
            >
              Products
            </Link>
            <Link 
              to="/about" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-green-700 font-medium py-1.5 px-3 rounded-lg hover:bg-green-50/50 transition"
            >
              About
            </Link>
            <Link 
              to="/nearby" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-700 hover:text-green-700 font-medium py-1.5 px-3 rounded-lg hover:bg-green-50/50 transition"
            >
              Nearby Farmers
            </Link>

            {user && (
              <Link 
                to="/orders" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 hover:text-green-700 font-medium py-1.5 px-3 rounded-lg hover:bg-green-50/50 transition"
              >
                Orders
              </Link>
            )}

            {user && user.role === 'admin' && (
              <Link 
                to="/admin" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 hover:text-green-700 font-semibold py-1.5 px-3 rounded-lg hover:bg-green-50/50 transition"
              >
                Admin Dashboard
              </Link>
            )}

            {user && user.role === 'farmer' && (
              <Link 
                to="/inbox" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 hover:text-green-700 font-medium py-1.5 px-3 rounded-lg hover:bg-green-50/50 transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Messages
              </Link>
            )}

            <div className="border-t border-gray-100 pt-3 flex flex-col gap-3">
              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-green-800 font-semibold py-2 px-3 rounded-lg bg-green-50/50 flex items-center gap-1.5 hover:bg-green-50 transition"
                  >
                    <UserIcon className="w-4 h-4" /> {user.name} (Dashboard)
                  </Link>
                  <button 
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleLogout(e);
                    }} 
                    className="w-full text-left text-red-600 hover:text-red-700 font-medium py-2 px-3 rounded-lg hover:bg-red-50/50 transition flex items-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2.5 px-3">
                  <Link 
                    to="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center text-gray-700 hover:text-green-700 font-medium py-2 border border-gray-200 rounded-xl transition"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-center bg-green-600 text-white font-medium py-2 rounded-xl hover:bg-green-700 transition shadow-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* Top Divider with a premium glowing gradient border line */}
      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-green-300/60 to-transparent relative z-10"></div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-green-50/60 to-white text-gray-800 pt-16 pb-12 mt-auto relative overflow-hidden border-t border-green-100">
        {/* Subtle glowing radial background element */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.04),transparent_45%)] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12 text-left">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-600 tracking-tight">
              <Leaf className="w-6 h-6 text-green-600 flex-shrink-0 animate-pulse" />
              <span>AgriFusion</span>
            </div>
            <p className="text-gray-600 text-[13px] leading-relaxed max-w-sm font-medium">
              AgriFusion connects local Indian farms directly to urban households. Eliminating intermediaries guarantees 100% direct payouts to growers and fresher crops to consumers.
            </p>
            <div className="flex gap-3 pt-2">
              {[
                {
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  ),
                  href: 'https://facebook.com',
                  label: 'Facebook'
                },
                {
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                  href: 'https://twitter.com',
                  label: 'Twitter'
                },
                {
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  ),
                  href: 'https://linkedin.com',
                  label: 'LinkedIn'
                },
                {
                  icon: (
                    <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  ),
                  href: 'https://instagram.com',
                  label: 'Instagram'
                },
                {
                  icon: (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  ),
                  href: 'https://github.com',
                  label: 'GitHub'
                }
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:bg-green-50 hover:border-green-300 hover:-translate-y-1 transition-all duration-300 shadow-sm"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Marketplace Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-800">Marketplace</h4>
            <ul className="space-y-2.5 text-[13px]">
              {[
                { name: 'Home Hub', path: '/' },
                { name: 'Browse Crops', path: '/products' },
                { name: 'Nearby Discovery', path: '/nearby' },
                { name: 'About AgriFusion', path: '/about' }
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-600 hover:text-green-700 flex items-center gap-2 transition-all duration-200 group font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 group-hover:bg-green-600 transition-all duration-200"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Support Contact Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-800">Farmer Support Hub</h4>
            <div className="space-y-3.5 text-[13px] text-gray-600 font-medium">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Karnal Agri-Hub, Haryana, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />
                <span className="hover:text-green-700 transition-colors">+91 1800-FARM-HELP (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />
                <span className="select-all hover:text-green-700 transition-colors">support@agrifusion.org</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />
                <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-800">Join the Harvest</h4>
            <p className="text-gray-600 text-[13px] leading-relaxed font-medium">
              Get weekly market pricing, local crop demand reports, and fair-trade updates direct to your inbox.
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) {
                  toast.success('Thank you for subscribing to our harvest updates!');
                  setEmail('');
                }
              }}
              className="mt-3 flex flex-col gap-2"
            >
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all pr-12"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all flex items-center justify-center shadow-md shadow-green-950/20"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-green-700/70 font-semibold tracking-wide flex items-center gap-1">
                Direct Payout Guarantee &bull; Spam Free
              </span>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-7xl mx-auto border-t border-gray-150 my-6 relative z-10"></div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-gray-500">
          <div>
            &copy; {new Date().getFullYear()} AgriFusion Marketplace. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-green-700 transition-colors">Privacy Policy</a>
            <span>&bull;</span>
            <a href="#" className="hover:text-green-700 transition-colors">Terms of Service</a>
            <span>&bull;</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1 hover:text-green-700 transition-colors bg-white hover:bg-green-50 border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
            >
              <span>Scroll up</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
