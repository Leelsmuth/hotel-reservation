import Image from 'next/image';
import Icon from '../ui/Icon';
import PriceBreakdown from './PriceBreakdown';
import { formatStayDate, pluralize } from '@/lib/helpers/formatters';

const isMultiRoom = (rooms) => Array.isArray(rooms) && rooms.length > 1;

/**
 * Card summarising a stay: room photo and name, dates, guests and the price
 * breakdown. Used on the reservation form, checkout and "manage booking".
 *
 * For a booking with several rooms, also pass `rooms`
 * ([{ name, guests, guestsLabel?, note? }], one per room); `room` then only
 * sets the photo and `guests` is the total. `guestsLabel` (e.g. "2 adults,
 * 1 pet") replaces the plain guest count.
 */
const StaySummary = ({
  room,
  rooms,
  checkIn,
  checkOut,
  nights,
  guests,
  guestsLabel,
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
            {isMultiRoom(rooms)
              ? `${rooms.length} rooms`
              : (room?.name ?? 'Room')}
          </h2>
        </div>
        {badge}
      </div>

      {isMultiRoom(rooms) && (
        <ol className="mt-3 space-y-1.5 text-sm" aria-label="Rooms">
          {rooms.map((item, index) => (
            <li key={index} className="flex flex-wrap justify-between gap-x-3">
              <span className="text-ink-900">
                <span className="text-ink-600">Room {index + 1}:</span>{' '}
                <span className="font-medium">{item.name}</span>
                {item.note && (
                  <span className="text-ink-600"> · {item.note}</span>
                )}
              </span>
              <span className="text-ink-600">
                {item.guestsLabel ??
                  pluralize(Number(item.guests) || 1, 'guest')}
              </span>
            </li>
          ))}
        </ol>
      )}

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
            {isMultiRoom(rooms) ? `${rooms.length} rooms` : '1 room'} ·{' '}
            {guestsLabel ?? pluralize(Number(guests) || 1, 'guest')}
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
