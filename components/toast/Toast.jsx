'use client';

import { useToast } from '@/context/ToastContext';
import Icon from '../ui/Icon';

const positionStyles = {
  TR: 'top-4 right-4 flex-col',
  BR: 'bottom-4 right-4 flex-col-reverse',
  TL: 'top-4 left-4 flex-col',
  BL: 'bottom-4 left-4 flex-col-reverse',
  TC: 'top-4 left-1/2 -translate-x-1/2 flex-col',
  BC: 'bottom-4 left-1/2 -translate-x-1/2 flex-col-reverse',
};

const TYPES = {
  success: {
    icon: 'check-circle',
    accent: 'bg-green-600',
    iconColor: 'text-green-700',
    label: 'Success',
  },
  error: {
    icon: 'error',
    accent: 'bg-red-600',
    iconColor: 'text-red-700',
    label: 'Error',
  },
  warning: {
    icon: 'warning',
    accent: 'bg-amber-500',
    iconColor: 'text-amber-700',
    label: 'Warning',
  },
  info: {
    icon: 'info',
    accent: 'bg-sky-600',
    iconColor: 'text-sky-700',
    label: 'Notice',
  },
};

/**
 * Toast notifications (see ToastContext). White cards with a coloured accent
 * and icon, so text stays high-contrast whatever the type. The regions are
 * always rendered so screen readers announce new toasts: errors assertively,
 * everything else politely.
 */
const Toast = () => {
  const { toasts, removeToast } = useToast();

  // The default (bottom-right) region always exists, so it's already in the
  // page when a toast is added and screen readers pick it up reliably
  const groupedToasts = toasts.reduce(
    (acc, toast) => {
      const position = toast.position || 'BR';
      acc[position] = acc[position] || [];
      acc[position].push(toast);
      return acc;
    },
    { BR: [] }
  );

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div
          key={position}
          aria-live="polite"
          className={`pointer-events-none fixed z-[90] flex w-[calc(100%-2rem)] gap-3 sm:w-96 ${
            positionStyles[position] ?? positionStyles.BR
          }`}
        >
          {positionToasts.map((toast) => {
            const type = TYPES[toast.type] ?? TYPES.info;
            return (
              <div
                key={toast.id}
                role={toast.type === 'error' ? 'alert' : undefined}
                className="pointer-events-auto relative flex animate-toast-in gap-3 overflow-hidden rounded-xl border border-ink-100 bg-white p-4 pl-5 text-sm text-ink-900 shadow-popover"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1.5 ${type.accent}`}
                />
                <Icon
                  name={type.icon}
                  className={`mt-0.5 h-5 w-5 ${type.iconColor}`}
                />
                <div className="min-w-0 flex-1">
                  <span className="sr-only">{type.label}: </span>
                  <p className="font-medium leading-snug">{toast.message}</p>
                  {toast.action && (
                    <button
                      type="button"
                      className="mt-2 rounded font-semibold text-gold-700 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-ink-900"
                      onClick={toast.action}
                    >
                      {toast.actionLabel || 'Action'}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="-m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900"
                  aria-label="Dismiss notification"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};

export default Toast;
