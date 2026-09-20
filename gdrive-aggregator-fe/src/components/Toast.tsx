import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(toasts[0].id);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-900/95 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p className="text-xs font-semibold leading-snug">{toast.message}</p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
