// components/ui/use-toast.tsx
'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';

type ToastOptions = {
  title: string;
  description?: string;
};

const ToastContext = React.createContext<(options: ToastOptions) => void>(() => {});

export function ToastProviderWrapper({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastOptions[]>([]);

  const showToast = (toast: ToastOptions) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 4000); // auto dismiss
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right">
        {toasts.map((t, i) => (
          <ToastPrimitive.Root key={i} className="bg-white border p-4 rounded shadow">
            <ToastPrimitive.Title className="font-bold">{t.title}</ToastPrimitive.Title>
            {t.description && <ToastPrimitive.Description>{t.description}</ToastPrimitive.Description>}
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 w-96 flex flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
