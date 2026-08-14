import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-500 shrink-0" />;
      default:
        return <Info size={18} className="text-olive-primary shrink-0" />;
    }
  };

  return (
    <div className="pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border border-olive-sage/30 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-cream text-sm backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-2.5">
        {getIcon()}
        <span className="font-medium leading-tight">{toast.text}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </div>
  );
};
