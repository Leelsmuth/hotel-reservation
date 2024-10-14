// app/components/Toast.js
'use client';

import { useToast } from '@/context/ToastContext';

const positionStyles = {
  TR: 'top-4 right-4 flex flex-col space-y-2',
  BR: 'bottom-4 right-4 flex flex-col-reverse space-y-2',
  TL: 'top-4 left-4 flex flex-col space-y-2',
  BL: 'bottom-4 left-4 flex flex-col-reverse space-y-2',
  TC: 'top-4 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2',
  BC: 'bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col-reverse space-y-2',
};

const Toast = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  // Group toasts by position to stack them properly
  const groupedToasts = toasts.reduce((acc, toast) => {
    const position = toast.position || 'BR';
    acc[position] = acc[position] || [];
    acc[position].push(toast);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className={`fixed ${positionStyles[position]}`}>
          {positionToasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-md shadow-lg text-white transition-all mb-2 ${
                toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{toast.message}</span>
                <div className="ml-4 flex space-x-2">
                  {toast.action && (
                    <button
                      className="px-2 py-1 bg-gray-700 rounded-md"
                      onClick={toast.action}
                    >
                      {toast.actionLabel || 'Action'}
                    </button>
                  )}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="px-2 py-1 bg-gray-700 rounded-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
};

export default Toast;
