import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import ProductForm from './shared/ProductForm';

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
            onSubmit={handleSave}
            submitLabel="Save Changes"
            onCancel={() => navigate('/products')}
          />
        )}
      </div>
    </div>
  );
}
