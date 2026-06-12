import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    loading: (msg) => addToast(msg, 'loading', 0),
    dismiss: (id) => dismissToast(id),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Floating toast stack */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 transform translate-x-0 animate-in slide-in-from-right-10 duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50/95 backdrop-blur-md border-emerald-100 text-emerald-900'
                : t.type === 'error'
                ? 'bg-red-50/95 backdrop-blur-md border-red-100 text-red-900'
                : 'bg-white/95 backdrop-blur-md border-green-100 text-green-950'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />}
              {t.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
              {t.type === 'loading' && <Loader2 className="w-5 h-5 text-green-700 animate-spin" />}
            </div>

            {/* Message */}
            <div className="flex-grow text-sm font-semibold leading-relaxed">{t.message}</div>

            {/* Dismiss Button */}
            {t.type !== 'loading' && (
              <button
                onClick={() => dismissToast(t.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
