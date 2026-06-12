import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, Edit, Trash2, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { useToast } from './Toast';

export default function MyProducts({ user }) {
  const toast = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [currentMarketPrice, setCurrentMarketPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      // Filter for items created by this logged-in farmer
      const myItems = response.data.filter(p => {
        const creatorId = p.createdBy?._id || p.createdBy;
        return creatorId === user.id;
      });
      setProducts(myItems);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your product listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'farmer') {
      navigate('/login');
      return;
    }
    fetchMyProducts();
  }, [user]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(null);
    const toastId = toast.loading('Listing your new crop...');
    try {
      await api.post('/products', {
        title,
        description,
        imageUrl,
        currentMarketPrice: Number(currentMarketPrice),
        sellingPrice: Number(sellingPrice),
        tags
      });
      setIsAddOpen(false);
      resetForm();
      toast.dismiss(toastId);
      toast.success('Crop listed on the marketplace!');
      fetchMyProducts();
    } catch (err) {
      toast.dismiss(toastId);
      const errMsg = err.response?.data?.error || 'Failed to list product';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this crop listing? This cannot be undone.')) return;
    const toastId = toast.loading('Deleting crop listing...');
    try {
      await api.delete(`/products/${productId}`);
      toast.dismiss(toastId);
      toast.success('Crop listing removed.');
      fetchMyProducts();
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Failed to delete listing.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setCurrentMarketPrice('');
    setSellingPrice('');
    setTags([]);
    setNewTagInput('');
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-green-100 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-green-955">My Listed Crops</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and edit your direct marketplace crop listings.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsAddOpen(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md hover:scale-102 self-end md:self-auto"
        >
          <PlusCircle className="w-5 h-5" /> Add New Crop
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-green-50 shadow-sm flex flex-col h-[380px]">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6 flex flex-col flex-grow space-y-4">
                <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                <div className="h-3 bg-gray-150 rounded-lg w-1/2"></div>
                <div className="flex justify-between mt-auto pt-4 border-t">
                  <div className="h-6 bg-gray-200 rounded-lg w-12"></div>
                  <div className="h-10 bg-gray-250 rounded-xl w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div 
              key={product._id} 
              className="bg-white rounded-3xl overflow-hidden border border-green-100/60 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group animate-in fade-in"
            >
              {/* Product Image */}
              <div className="h-48 overflow-hidden bg-gray-50 relative">
                <img 
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=600'} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition duration-500"
                />
              </div>

              {/* Card Details */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-green-955 mb-2">{product.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-4">{product.description}</p>
                
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-gray-400 line-through text-[10px]">Market: ₹{product.currentMarketPrice}</span>
                    <span className="text-xl font-bold text-green-700">₹{product.sellingPrice}</span>
                  </div>
                </div>

                {/* Edit & Delete CTA Actions */}
                <div className="mt-5 border-t border-gray-100 pt-4 flex gap-3">
                  <button
                    onClick={() => navigate(`/products/edit/${product._id}`)}
                    className="flex-grow flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-bold text-xs transition"
                  >
                    <Edit className="w-4 h-4" /> Edit Details
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="flex-grow flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2.5 rounded-xl font-bold text-xs transition"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto flex flex-col items-center">
          <div className="text-4xl text-gray-400 font-bold mb-2">No Listings</div>
          <p className="mt-4 text-gray-500 font-extrabold text-lg">You haven't listed any crops yet</p>
          <p className="text-xs text-gray-400 max-w-xs mt-1.5 mb-6 text-center leading-relaxed">
            Direct farmer listings are displayed to buyers across India. List your first harvest to start trading.
          </p>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md"
          >
            List Your First Crop
          </button>
        </div>
      )}

      {/* Add Product Modal (Farmer Only) */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 relative border border-green-50 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              ✕
            </button>
            <h2 className="text-xl font-extrabold text-green-955 mb-5 flex items-center gap-1">Add Market Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Crop Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Organic Basmati Rice" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  placeholder="Detailed explanation of quality, harvest method..." 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..." 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
                  required
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-2 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Crop Tags</label>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-lg border border-green-200 flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-red-500 hover:text-red-700 font-black ml-1 text-[10px]">✕</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Custom tag (e.g. Rabi)"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="flex-grow px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-green-500 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTagInput.trim()) {
                          addTag(newTagInput.trim());
                          setNewTagInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTagInput.trim()) {
                        addTag(newTagInput.trim());
                        setNewTagInput('');
                      }
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Market Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Market Price" 
                    value={currentMarketPrice} 
                    onChange={(e) => setCurrentMarketPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Selling Price" 
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md mt-2"
              >
                Create Listing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
