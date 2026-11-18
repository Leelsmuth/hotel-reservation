'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { getFocusable, trapTabKey } from '@/lib/helpers/focus';

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-3xl',
};

/**
 * Accessible dialog used by every modal in the app.
 * - role="dialog" + aria-modal, labelled by its title
 * - Escape closes it, focus moves in on open, stays inside (Tab wraps),
 *   and returns to the element that opened it
 * - the page behind doesn't scroll
 * - bottom sheet on small screens, centred card from `sm` up
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  // Latest onClose without re-running the effect on every render
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const [first] = getFocusable(panel);
    (first ?? panel)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      trapTabKey(event, panel);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in items-end justify-center bg-ink-900/60 sm:items-center sm:p-6"
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`flex max-h-[90vh] w-full animate-dialog-in flex-col overflow-hidden rounded-t-2xl bg-white shadow-popover focus:outline-none sm:rounded-2xl ${
          SIZES[size] ?? SIZES.md
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id={titleId}
              className="font-display text-xl font-semibold text-ink-900"
            >
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-600">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
            aria-label="Close dialog"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 text-[0.9375rem] text-ink-700 sm:px-6">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
