import Spinner from '../anim/Spinner';

/**
 * Spinner with a label that screen readers announce.
 * `overlay` covers the page (e.g. while a payment or cancellation is in
 * flight) so the user can't submit twice.
 */
const LoadingState = ({
  label = 'Loading…',
  overlay = false,
  className = '',
}) => {
  if (overlay) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[70] flex animate-fade-in flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lift">
          <Spinner
            spinnerColor="text-gold-700"
            spinnerHeight="h-8"
            spinnerWidth="w-8"
            inline
          />
        </span>
        <p className="font-medium text-ink-800">{label}</p>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 py-16 text-ink-600 ${className}`}
    >
      <Spinner
        spinnerColor="text-gold-700"
        spinnerHeight="h-6"
        spinnerWidth="w-6"
        inline
      />
      <span className="font-medium">{label}</span>
    </div>
  );
};

export default LoadingState;
