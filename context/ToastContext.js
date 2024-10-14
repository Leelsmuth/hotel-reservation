'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', options = {}) => {
    const id = Date.now(); // Unique ID for each toast
    const newToast = { id, message, type, ...options };
    setToasts((prevToasts) => [...prevToasts, newToast]);

    if (options.autoClose) {
      setTimeout(() => removeToast(id), options.duration || 3000);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
