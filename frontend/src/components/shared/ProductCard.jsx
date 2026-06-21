import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, ShoppingCart, MessageSquare } from 'lucide-react';

export default function ProductCard({ product, isOwner, onEdit, onDelete, onAddToCart }) {
  const creatorName = product.createdBy?.name || 'Farmer';
  const imageUrl = product.imageUrl || 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?q=80&w=600';

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-green-100/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group animate-in fade-in duration-350">
      {/* Product Image */}
      <div className="h-48 overflow-hidden bg-gray-50 relative">
        <img 
          src={imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        {!isOwner && (
          <div className="absolute top-3 right-3 bg-green-100 text-green-900 text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">
            {creatorName}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-green-955 mb-2">{product.title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-4">{product.description}</p>
        
        {/* Tags */}
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
              {onEdit && (
                <button
                  onClick={() => onEdit(product._id)}
                  className="flex-grow flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl font-bold text-sm transition"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(product._id)}
                  className="flex-grow flex items-center justify-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2.5 rounded-xl font-bold text-sm transition"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {onAddToCart && (
                <button
                  onClick={() => onAddToCart(product._id)}
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
                  <MessageSquare className="w-4 h-4" /> Chat
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
