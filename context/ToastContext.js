'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  // Counter, not Date.now(): toasts shown in the same millisecond need
  // different ids
  const nextId = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Shows a toast and returns its id, so callers can remove it later with
   * removeToast(id) (e.g. a persistent toast with an action).
   */
  const showToast = useCallback(
    (message, type = 'success', options = {}) => {
      nextId.current += 1;
      const id = nextId.current;
      const newToast = { id, message, type, ...options };
      setToasts((prevToasts) => [...prevToasts, newToast]);

      if (options.autoClose) {
        setTimeout(() => removeToast(id), options.duration || 3000);
      }

      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
