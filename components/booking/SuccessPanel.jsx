import Icon from '../ui/Icon';
import CopyButton from '../ui/CopyButton';

/**
 * Confirmation card shared by "reservation made" and "booking confirmed":
 * a clear headline, the booking ID (with copy) and what happens next.
 */
const SuccessPanel = ({
  title,
  intro,
  bookingId,
  idLabel = 'Booking ID',
  children,
}) => (
  <div className="card mx-auto max-w-2xl overflow-hidden">
    <div className="border-b border-ink-100 bg-sand-50 px-6 py-8 text-center sm:px-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700 ring-8 ring-green-50/60">
        <Icon name="check-circle" className="h-9 w-9" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        {title}
      </h1>
      {intro && <p className="mx-auto mt-3 max-w-md text-ink-600">{intro}</p>}
      {bookingId && (
        <div className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-3 rounded-xl border border-dashed border-gold-400 bg-white px-5 py-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">
              {idLabel}
            </p>
            <p className="font-mono text-2xl font-semibold tracking-widest text-ink-900">
              {bookingId}
            </p>
          </div>
          <CopyButton value={bookingId} label="Copy ID" />
        </div>
      )}
    </div>
    <div className="px-6 py-8 sm:px-10">{children}</div>
  </div>
);

export default SuccessPanel;
