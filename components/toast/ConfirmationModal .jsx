'use client';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { formatPrice } from '@/lib/helpers/formatters';

/**
 * Confirms cancelling a reservation (free) or a paid booking (30% fee).
 * The safe choice ("Keep …") is the secondary button; the destructive one is
 * red and says exactly what it does.
 *
 * `roomCount` is the number of rooms being cancelled together (a multi-room
 * booking). `roomOnly` cancels just one room of a multi-room booking.
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  price,
  isBooking = true,
  roomCount = 1,
  roomOnly = false,
}) => {
  const noun = roomOnly ? 'room' : isBooking ? 'booking' : 'reservation';
  const scopeNote = roomOnly
    ? `The other rooms in this booking stay ${isBooking ? 'booked' : 'reserved'}.`
    : roomCount > 1
      ? `All ${roomCount} rooms in this ${noun} will be cancelled.`
      : null;
  const hasPrice =
    Number.isFinite(Number(price)) && price !== undefined && price !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={`Cancel this ${noun}?`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep {noun}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Yes, cancel {noun}
          </Button>
        </>
      }
    >
      {isBooking ? (
        <div className="space-y-4">
          <p>
            Cancelling a paid booking incurs a{' '}
            <strong>30% cancellation fee</strong>.{scopeNote && ` ${scopeNote}`}
          </p>
          {hasPrice && (
            <dl className="space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Amount paid</dt>
                <dd className="tabular-nums">{formatPrice(price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Cancellation fee (30%)</dt>
                <dd className="tabular-nums">−{formatPrice(0.3 * price)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-200 pt-2 font-semibold text-ink-900">
                <dt>You'll be refunded</dt>
                <dd className="tabular-nums">{formatPrice(0.7 * price)}</dd>
              </div>
            </dl>
          )}
          <Alert tone="warning">This can't be undone.</Alert>
        </div>
      ) : (
        <div className="space-y-4">
          <p>
            {roomOnly
              ? 'This room will be released'
              : roomCount > 1
                ? 'Your rooms will be released'
                : 'Your room will be released'}{' '}
            and you won't be charged. This can't be undone.
          </p>
          {scopeNote && <p>{scopeNote}</p>}
        </div>
      )}
    </Modal>
  );
};

export default ConfirmationModal;
