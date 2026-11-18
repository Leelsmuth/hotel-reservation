import Icon from '../ui/Icon';

export const BOOKING_STEPS = [
  { label: 'Choose a room', short: 'Room' },
  { label: 'Your details', short: 'Details' },
  { label: 'Reserved', short: 'Reserved' },
  { label: 'Pay & confirm', short: 'Payment' },
];

/**
 * Where the guest is in the booking flow. `current` is 1-based; pass
 * BOOKING_STEPS.length + 1 once everything is done.
 */
const BookingSteps = ({ current = 1, className = '' }) => {
  const total = BOOKING_STEPS.length;
  const active = BOOKING_STEPS[Math.min(current, total) - 1];
  const done = current > total;

  return (
    <nav aria-label="Booking progress" className={className}>
      {/* Small screens: compact summary + progress bar */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-ink-700">
          {done ? (
            'All steps complete'
          ) : (
            <>
              Step {current} of {total}:{' '}
              <span className="font-semibold text-ink-900">{active.label}</span>
            </>
          )}
        </p>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-gold-500 transition-all"
            style={{ width: `${(Math.min(current, total) / total) * 100}%` }}
          />
        </div>
      </div>

      <ol className="hidden items-center sm:flex">
        {BOOKING_STEPS.map((step, index) => {
          const number = index + 1;
          const isComplete = number < current;
          const isCurrent = number === current;
          return (
            <li
              key={step.label}
              className="flex flex-1 items-center last:flex-none"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ring-1 ring-inset ${
                    isComplete
                      ? 'bg-ink-900 text-white ring-ink-900'
                      : isCurrent
                        ? 'bg-gold-400 text-ink-900 ring-gold-500'
                        : 'bg-white text-ink-600 ring-ink-300'
                  }`}
                >
                  {isComplete ? (
                    <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    number
                  )}
                </span>
                <span
                  className={`whitespace-nowrap text-sm ${
                    isCurrent ? 'font-semibold text-ink-900' : 'text-ink-600'
                  }`}
                >
                  {step.label}
                  {isComplete && <span className="sr-only"> (completed)</span>}
                </span>
              </span>
              {number < total && (
                <span
                  aria-hidden="true"
                  className={`mx-3 h-px flex-1 lg:mx-4 ${
                    isComplete ? 'bg-ink-900' : 'bg-ink-200'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BookingSteps;
