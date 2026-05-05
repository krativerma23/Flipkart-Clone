/* eslint-disable */
'use client';

import { CheckCircle, XCircle, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function ToastContainer() {
  const { toasts, dismissToast } = useCart();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg
                      shadow-xl text-white text-sm font-medium max-w-xs animate-fade-in
                      ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}
        >
          {toast.type === 'error'
            ? <XCircle size={16} className="flex-shrink-0 text-red-200" />
            : <CheckCircle size={16} className="flex-shrink-0 text-green-400" />
          }
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="ml-1 text-white/60 hover:text-white transition-colors flex-shrink-0"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
