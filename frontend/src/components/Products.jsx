import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, Edit, Trash2, ShoppingCart, MessageCircle, AlertCircle, X, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useToast } from './Toast';

export default function Products({ user }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState(1500); // default maximum filter
  const [sortBy, setSortBy] = useState(''); // 'lowToHigh', 'highToLow', ''

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentEditProduct, setCurrentEditProduct] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [currentMarketPrice, setCurrentMarketPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  
  // Tags states
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  
  const navigate = useNavigate();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      
      // Dynamically set price range max if crops are more expensive
      if (response.data.length > 0) {
        const highestPrice = Math.max(...response.data.map(p => p.sellingPrice || 0));
        setPriceRange(highestPrice > 0 ? highestPrice : 1500);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(null);
    const toastId = toast.loading('Creating crop listing...');
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
      toast.success('Crop listed successfully!');
      fetchProducts();
    } catch (err) {
      toast.dismiss(toastId);
      const errMsg = err.response?.data?.error || 'Failed to add product';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const openEditModal = (product) => {
    setCurrentEditProduct(product);
    setTitle(product.title);
    setDescription(product.description);
    setImageUrl(product.imageUrl);
    setCurrentMarketPrice(product.currentMarketPrice);
    setSellingPrice(product.sellingPrice);
    setTags(product.tags || []);
    setAiTags([]);
    setAiPriceSuggestion(null);
    setSuggestionCropName(product.title);
    setSuggestionSeason('Rabi');
    setIsEditOpen(true);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setError(null);
    const toastId = toast.loading('Saving crop changes...');
    try {
      await api.put(`/products/${currentEditProduct._id}`, {
        title,
        description,
        imageUrl,
        currentMarketPrice: Number(currentMarketPrice),
        sellingPrice: Number(sellingPrice),
        tags
      });
      setIsEditOpen(false);
      resetForm();
      toast.dismiss(toastId);
      toast.success('Crop changes saved!');
      fetchProducts();
    } catch (err) {
      toast.dismiss(toastId);
      const errMsg = err.response?.data?.error || 'Failed to edit product';
      setError(errMsg);
      toast.error(errMsg);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product from the marketplace?')) return;
    setError(null);
    const toastId = toast.loading('Deleting crop listing...');
    try {
      await api.delete(`/products/${productId}`);
      toast.dismiss(toastId);
      toast.success('Listing deleted successfully.');
      fetchProducts();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Failed to delete product listing.');
      setError('Failed to delete product');
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setError(null);
    const toastId = toast.loading('Adding crop to cart...');
    try {
      await api.post(`/cart/add/${productId}`);
      toast.dismiss(toastId);
      toast.success('Product added to cart successfully!');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Failed to add crop to cart.');
      setError('Could not add to cart.');
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
    setCurrentEditProduct(null);
  };

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  // Perform filtering & sorting in client memory
  const filteredProducts = products
    .filter(product => {
      const matchSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.tags && product.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchPrice = product.sellingPrice <= priceRange;
      return matchSearch && matchPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'lowToHigh') return a.sellingPrice - b.sellingPrice;
      if (sortBy === 'highToLow') return b.sellingPrice - a.sellingPrice;
      return 0; // default order
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
      {/* Header and Add Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-green-100 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-green-955">Marketplace Products</h1>
          <p className="text-gray-500 text-sm mt-1">Buy direct from farmers and support sustainable agriculture</p>
        </div>
        {(user && (user.role === 'farmer' || user.role === 'admin')) && (
          <button
            onClick={() => { resetForm(); setIsAddOpen(true); }}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md hover:scale-102 self-end md:self-auto"
          >
            <PlusCircle className="w-5 h-5" /> Add Product
          </button>
        )}
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="bg-white p-5 rounded-3xl border border-green-50 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search crops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
          />
        </div>

        {/* Price Slider */}
        <div className="w-full md:max-w-sm flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-grow">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Max Price</span>
              <span className="font-bold text-green-700">₹{priceRange}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
          </div>
        </div>

        {/* Sorting */}
        <div className="w-full md:max-w-xs flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Default Sorting</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 text-red-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-green-50 shadow-sm flex flex-col h-[380px] animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6 flex flex-col flex-grow space-y-4">
                <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-150 rounded-lg w-full"></div>
                  <div className="h-3 bg-gray-150 rounded-lg w-5/6"></div>
                </div>
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-150 rounded-lg w-10"></div>
                    <div className="h-6 bg-gray-200 rounded-lg w-16"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded-xl w-28"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const isOwner = user && (
              user.role === 'admin' ||
              (user.role === 'farmer' && 
               product.createdBy && 
               (product.createdBy._id === user.id || product.createdBy === user.id))
            );

            return (
              <div 
                key={product._id} 
                className="bg-white rounded-3xl overflow-hidden border border-green-100/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group animate-in fade-in duration-350"
              >
                {/* Image */}
                <div className="h-48 overflow-hidden bg-gray-50 relative">
                  <img 
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=600'} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-green-100 text-green-900 text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">
                    {product.createdBy?.name || 'Farmer'}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-green-955 mb-2">{product.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-4">{product.description}</p>
                  
                  {/* Tags Badges */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-green-50 text-green-700 font-bold px-2.5 py-0.5 rounded-full border border-green-100">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-4">
                    <div className="flex flex-col">
                      <span className="text-gray-400 line-through text-xs">₹{product.currentMarketPrice}</span>
                      <span className="text-2xl font-bold text-green-700">₹{product.sellingPrice}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    {isOwner ? (
                      <div className="flex gap-2 justify-between">
                        <button
                          onClick={() => navigate(`/products/edit/${product._id}`)}
                          className="flex-grow flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-bold text-sm transition"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="flex-grow flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2.5 rounded-xl font-bold text-sm transition"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {(!user || user.role === 'customer') && (
                          <button
                            onClick={() => handleAddToCart(product._id)}
                            className="flex-grow bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <ShoppingCart className="w-4 h-4" /> Add To Cart
                          </button>
                        )}
                        {product.createdBy && (
                          <Link
                            to={`/chat/${product.createdBy._id || product.createdBy}`}
                            className="bg-white hover:bg-gray-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" /> Chat
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto mt-8">
          <div className="text-4xl text-gray-400 font-bold mb-2">No Results</div>
          <p className="mt-4 text-gray-500 font-semibold text-lg">No crops match your query filters.</p>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 relative border border-green-50 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-extrabold text-green-955 mb-6 flex items-center gap-1">Add Market Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input 
                type="text" 
                placeholder="Product Title (e.g. Organic Wheat)" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                required
              />
              <textarea 
                placeholder="Detailed Crop Description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                required
              />
              <input 
                type="url" 
                placeholder="Image URL (e.g. https://...)" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                required
              />

              {/* Tags Section */}
              <div className="space-y-2 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Crop Tags</label>
                </div>
                
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
                    onClick={(e) => {
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
                <input 
                  type="number" 
                  placeholder="Market Price (₹)" 
                  value={currentMarketPrice} 
                  onChange={(e) => setCurrentMarketPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                />
                <input 
                  type="number" 
                  placeholder="Selling Price (₹)" 
                  value={sellingPrice} 
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md"
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
