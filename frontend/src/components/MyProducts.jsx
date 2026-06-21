import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import ProductCard from './shared/ProductCard';
import ProductCardSkeleton from './shared/ProductCardSkeleton';
import ProductForm from './shared/ProductForm';
import ConfirmationModal from './shared/ConfirmationModal';

export default function MyProducts({ user }) {
  const toast = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add modal states
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isOwner={true}
              onEdit={(id) => navigate(`/products/edit/${id}`)}
              onDelete={triggerDeleteConfirm}
            />
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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
            >
              ✕
            </button>
            <h2 className="text-xl font-extrabold text-green-955 mb-5 flex items-center gap-1">Add Market Product</h2>
            
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
        message="Are you sure you want to delete this crop listing? This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
