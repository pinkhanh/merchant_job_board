'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error';
type ToastItem = { id: number; type: ToastType; message: string };
type ToastContextValue = { showToast: (type: ToastType, message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg shadow-modal pointer-events-auto ${
              toast.type === 'success'
                ? 'bg-status-active-bg border border-status-active-text/20'
                : 'bg-status-off-bg border border-status-off-text/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 text-status-active-text shrink-0 mt-0.5" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-status-off-text shrink-0 mt-0.5" />
            )}
            <p className={`text-sm flex-1 ${toast.type === 'success' ? 'text-status-active-text' : 'text-status-off-text'}`}>
              {toast.message}
            </p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="opacity-60 hover:opacity-100"
              aria-label="Đóng"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải dùng bên trong ToastProvider');
  return ctx.showToast;
}
