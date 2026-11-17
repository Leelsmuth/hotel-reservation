import { USE_MOCKS } from '@/lib/config/mockMode';

/**
 * Always-visible reminder that the app is running on dummy data (Firebase,
 * Stripe, PayPal and email are mocked; see README > Mock mode). Renders
 * nothing outside mock mode. Bottom-centre keeps it clear of the toasts
 * (bottom-right) and the Next.js dev indicator (bottom-left), and it ignores
 * clicks so it never blocks the page.
 */
const MockModeBadge = () => {
  if (!USE_MOCKS) return null;

  return (
    <div
      role="status"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-black shadow-lg pointer-events-none"
    >
      Mock mode · dummy data
    </div>
  );
};

export default MockModeBadge;
