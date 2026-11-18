import Image from 'next/image';
import Icon from '../ui/Icon';
import PriceBreakdown from './PriceBreakdown';
import { formatStayDate, pluralize } from '@/lib/helpers/formatters';

/**
 * Card summarising a stay: room photo and name, dates, guests and the price
 * breakdown. Used on the reservation form, checkout and "manage booking".
 */
const StaySummary = ({
  room,
  checkIn,
  checkOut,
  nights,
  guests,
  bookingId,
  price,
  heading = 'Your stay',
  footnote,
  badge,
  className = '',
}) => (
  <section aria-label={heading} className={`card overflow-hidden ${className}`}>
    {room?.image && (
      <div className="relative aspect-[3/1] bg-ink-100">
        <Image
          src={room.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 400px, 100vw"
          className="object-cover"
        />
      </div>
    )}
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{heading}</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink-900">
            {room?.name ?? 'Room'}
          </h2>
        </div>
        {badge}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-sand-50 p-4 text-sm">
        <div>
          <dt className="text-ink-600">Check-in</dt>
          <dd className="mt-0.5 font-semibold text-ink-900">
            {formatStayDate(checkIn)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-600">Check-out</dt>
          <dd className="mt-0.5 font-semibold text-ink-900">
            {formatStayDate(checkOut)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-600">Length of stay</dt>
          <dd className="mt-0.5 font-semibold text-ink-900">
            {pluralize(Number(nights) || 0, 'night')}
          </dd>
        </div>
        <div>
          <dt className="text-ink-600">Guests</dt>
          <dd className="mt-0.5 font-semibold text-ink-900">
            1 room · {pluralize(Number(guests) || 1, 'guest')}
          </dd>
        </div>
        {bookingId && (
          <div className="col-span-2 border-t border-sand-200 pt-3">
            <dt className="text-ink-600">Booking ID</dt>
            <dd className="mt-0.5 font-mono text-base font-semibold tracking-wider text-ink-900">
              {bookingId}
            </dd>
          </div>
        )}
      </dl>

      {price && (
        <div className="mt-5">
          <h3 className="sr-only">Price breakdown</h3>
          <PriceBreakdown {...price} />
        </div>
      )}

      {footnote && (
        <p className="mt-4 flex gap-2 text-xs text-ink-600">
          <Icon name="info" className="h-4 w-4 text-ink-500" />
          <span>{footnote}</span>
        </p>
      )}
    </div>
  </section>
);

export default StaySummary;
