import React from 'react';
import TagInput from './TagInput';
import { Save } from 'lucide-react';

export default function ProductForm({ values, onChange, onSubmit, submitLabel = "Save Changes", onCancel }) {
  const { title, description, imageUrl, currentMarketPrice, sellingPrice, tags = [] } = values;

  const handleTagAdd = (newTag) => {
    if (!tags.includes(newTag)) {
      onChange('tags', [...tags, newTag]);
    }
  };

  const handleTagRemove = (tagToRemove) => {
    onChange('tags', tags.filter(t => t !== tagToRemove));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Crop Title</label>
        <input 
          type="text" 
          placeholder="e.g. Organic Basmati Rice" 
          value={title || ''} 
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
          required
        />
      </div>
      
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
        <textarea 
          placeholder="Detailed explanation of quality, harvest method..." 
          value={description || ''} 
          onChange={(e) => onChange('description', e.target.value)}
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
          value={imageUrl || ''} 
          onChange={(e) => onChange('imageUrl', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
          required
        />
        {imageUrl && (
          <div className="mt-3 w-full h-32 rounded-2xl overflow-hidden border border-gray-150 bg-gray-50">
            <img src={imageUrl} alt="Crop preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Embed TagInput directly */}
      <TagInput 
        tags={tags} 
        onAdd={handleTagAdd} 
        onRemove={handleTagRemove} 
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Market Price (₹)</label>
          <input 
            type="number" 
            placeholder="Market Price" 
            value={currentMarketPrice || ''} 
            onChange={(e) => onChange('currentMarketPrice', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Selling Price (₹)</label>
          <input 
            type="number" 
            placeholder="Selling Price" 
            value={sellingPrice || ''} 
            onChange={(e) => onChange('sellingPrice', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50/50"
            required
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-grow border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-1.5"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit"
          className="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 text-sm"
        >
          {submitLabel === "Save Changes" && <Save className="w-4.5 h-4.5" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
