import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Save, X, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';

export default function EditProduct({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [currentMarketPrice, setCurrentMarketPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'farmer' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get('/products');
        const product = response.data.find(p => p._id === id);
        if (!product) {
          setError('Product not found.');
          return;
        }

        // Owner check
        const ownerId = product.createdBy?._id || product.createdBy;
        if (ownerId !== user.id && user.role !== 'admin') {
          setError('Unauthorized: You do not own this product listing.');
          return;
        }

        setTitle(product.title);
        setDescription(product.description);
        setImageUrl(product.imageUrl);
        setCurrentMarketPrice(product.currentMarketPrice);
        setSellingPrice(product.sellingPrice);
        setTags(product.tags || []);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id, user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    const toastId = toast.loading('Saving product changes...');
    try {
      await api.put(`/products/${id}`, {
        title,
        description,
        imageUrl,
        currentMarketPrice: Number(currentMarketPrice),
        sellingPrice: Number(sellingPrice),
        tags
      });
      toast.dismiss(toastId);
      toast.success('Crop changes saved successfully!');
      navigate('/products');
    } catch (err) {
      toast.dismiss(toastId);
      const errMsg = err.response?.data?.error || 'Failed to update product';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center py-20 text-green-700 bg-green-50/20">
        <p className="mt-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Loading crop specifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 w-full flex-grow">
      {/* Back Link */}
      <div className="flex items-center gap-2 mb-6">
        <Link to="/products" className="text-green-700 hover:text-green-800 flex items-center gap-1 text-sm font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-green-150 shadow-xl p-8">
        <h1 className="text-2xl font-extrabold text-green-955 mb-2 flex items-center gap-1.5">
          Edit Crop Listing
        </h1>
        <p className="text-xs text-gray-400 mb-6">Modify details, parameters, and pricing for your listing in the public marketplace.</p>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm flex gap-3 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Crop Title</label>
              <input 
                type="text" 
                placeholder="Product Title (e.g. Premium Basmati)" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/30"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
              <textarea 
                placeholder="Describe your crop harvest, quality, organic standards..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/30"
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Image URL</label>
              <input 
                type="url" 
                placeholder="Illustration Image URL" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/30"
                required
              />
              {imageUrl && (
                <div className="mt-3 w-full h-40 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={imageUrl} alt="Crop preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div className="space-y-2.5 p-4 bg-green-50/20 rounded-2xl border border-green-100/50">
              <label className="block text-xs font-bold text-green-800 uppercase tracking-wider">Crop Tags</label>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="text-xs bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-lg border border-green-200 flex items-center gap-1">
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)} 
                        className="text-red-500 hover:text-red-700 font-black ml-1 text-[10px]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Custom tag (e.g. Winter crop)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:ring-1 focus:ring-green-500 focus:outline-none"
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
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Market Price (₹)</label>
                <input 
                  type="number" 
                  placeholder="Market Reference Price" 
                  value={currentMarketPrice} 
                  onChange={(e) => setCurrentMarketPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Selling Price (₹)</label>
                <input 
                  type="number" 
                  placeholder="Your Marketplace Rate" 
                  value={sellingPrice} 
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/30"
                  required
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-100 mt-6">
              <Link 
                to="/products"
                className="flex-grow text-center border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-1.5"
              >
                Cancel
              </Link>
              <button 
                type="submit"
                className="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 text-sm"
              >
                <Save className="w-4.5 h-4.5" /> Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
