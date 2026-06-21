import React, { useState } from 'react';

export default function TagInput({ tags = [], onAdd, onRemove, placeholder = "Custom tag (e.g. Rabi)" }) {
  const [input, setInput] = useState('');

  const submit = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onAdd(input.trim());
      setInput('');
    }
  };

  return (
    <div className="space-y-2 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Crop Tags</label>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-lg border border-green-200 flex items-center gap-1">
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className="text-red-500 hover:text-red-700 font-black ml-1 text-[10px]">✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
          className="flex-grow px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-green-500 focus:outline-none"
        />
        <button type="button" onClick={submit} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-semibold">Add</button>
      </div>
    </div>
  );
}
