import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, AlertCircle, X, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useToast } from './Toast';
import ProductCard from './shared/ProductCard';
import ProductCardSkeleton from './shared/ProductCardSkeleton';
import ProductForm from './shared/ProductForm';
import ConfirmationModal from './shared/ConfirmationModal';

export default function Products({ user }) {
  const toast = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState(1500); // default maximum filter
  const [maxPriceLimit, setMaxPriceLimit] = useState(2000); // dynamic max price limit
  const [sortBy, setSortBy] = useState(''); // 'lowToHigh', 'highToLow', ''

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [currentMarketPrice, setCurrentMarketPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [tags, setTags] = useState([]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data);
      
      // Dynamically set price range max if crops are more expensive
      if (response.data.length > 0) {
        const highestPrice = Math.max(...response.data.map(p => p.sellingPrice || 0));
        const limit = highestPrice > 0 ? highestPrice : 2000;
        setMaxPriceLimit(limit);
        setPriceRange(limit);
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

  const handleDeleteProduct = async (productId) => {
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

  const triggerDeleteConfirm = (productId) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setCurrentMarketPrice('');
    setSellingPrice('');
    setTags([]);
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
              max={maxPriceLimit}
              step="1"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-green-600"
              style={{
                background: `linear-gradient(to right, #16a34a 0%, #16a34a ${maxPriceLimit > 0 ? (priceRange / maxPriceLimit) * 100 : 0}%, #e5e7eb ${maxPriceLimit > 0 ? (priceRange / maxPriceLimit) * 100 : 0}%, #e5e7eb 100%)`
              }}
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
            <ProductCardSkeleton key={idx} />
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
              <ProductCard
                key={product._id}
                product={product}
                isOwner={isOwner}
                onEdit={(id) => navigate(`/products/edit/${id}`)}
                onDelete={triggerDeleteConfirm}
                onAddToCart={handleAddToCart}
              />
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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-extrabold text-green-955 mb-6 flex items-center gap-1">Add Market Product</h2>
            
            <ProductForm
              values={{ title, description, imageUrl, currentMarketPrice, sellingPrice, tags }}
              onChange={(field, value) => {
                if (field === 'title') setTitle(value);
                else if (field === 'description') setDescription(value);
                else if (field === 'imageUrl') setImageUrl(value);
                else if (field === 'currentMarketPrice') setCurrentMarketPrice(value);
                else if (field === 'sellingPrice') setSellingPrice(value);
                else if (field === 'tags') setTags(value);
              }}
              onSubmit={handleAddProduct}
              submitLabel="Create Listing"
              onCancel={() => setIsAddOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={() => {
          if (productToDelete) {
            handleDeleteProduct(productToDelete);
          }
        }}
        title="Delete Crop Listing"
        message="Are you sure you want to delete this crop listing from the marketplace? This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
