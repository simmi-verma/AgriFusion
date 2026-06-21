import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel" 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative border border-green-50 shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-50 p-2.5 rounded-2xl border border-red-100 text-red-600 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-green-955">{title}</h2>
        </div>
        
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-grow border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition text-sm flex items-center justify-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-grow bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center text-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
