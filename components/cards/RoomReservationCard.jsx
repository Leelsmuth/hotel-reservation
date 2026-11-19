import Image from 'next/image';
import Link from 'next/link';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';
import { CARD_AMENITIES, capacityText } from '@/lib/static/roomCatalog';
import { formatPrice, pluralize } from '@/lib/helpers/formatters';

/**
 * A room type in the availability results. Shows whether it's free for the
 * searched dates and what the whole stay costs (nightly rate, discount, tax),
 * not just the nightly rate.
 *
 * `estimate` is calculateBookingPrice() output for the searched stay.
 * `actionLabel` names the button (e.g. "Add to booking" once the guest has
 * picked rooms); `actionUnavailable` replaces the button with an explanation
 * (e.g. every free room of this type is already in the booking).
 * `petFriendlyFree` (searches with pets only) is how many pet-friendly rooms
 * of this type are free. `notForPets` greys the card out when it can't take
 * the guest's pets.
 */
const RoomReservationCard = ({
  room,
  available = true,
  estimate,
  reservationHandler,
  showModal,
  priority = false,
  actionLabel = 'Reserve',
  actionUnavailable,
  petFriendlyFree,
  notForPets = false,
}) => {
  const titleId = `room-result-${room.typeId}`;
  const greyed = !available || notForPets;

  return (
    <article
      aria-labelledby={titleId}
      className={`grid grid-cols-1 overflow-hidden rounded-2xl border bg-white shadow-card md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] ${
        greyed ? 'border-ink-200 bg-ink-50/60' : 'border-ink-100'
      }`}
    >
      <div className="relative aspect-[3/2] bg-ink-100 md:aspect-auto md:min-h-full">
        <Image
          src={room.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 340px, (min-width: 768px) 35vw, 100vw"
          className={`object-cover ${greyed ? 'grayscale-[60%] opacity-80' : ''}`}
        />
        <div className="absolute left-3 top-3">
          {available && notForPets ? (
            <Badge tone="dark">Not for pets on these dates</Badge>
          ) : available ? (
            <Badge tone="success" className="shadow-sm">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
              Available
            </Badge>
          ) : (
            <Badge tone="dark">Sold out for these dates</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:gap-8">
        <div className="min-w-0 flex-1">
          <h3
            id={titleId}
            className="font-display text-2xl font-semibold text-ink-900"
          >
            {room.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
            <Icon name="users" className="h-4 w-4" />
            {capacityText(room)}
          </p>
          {available && petFriendlyFree !== undefined && (
            <p
              className={`mt-1 flex items-center gap-1.5 text-sm ${
                petFriendlyFree > 0
                  ? 'font-medium text-ink-900'
                  : 'text-ink-600'
              }`}
            >
              <Icon
                name="paw"
                className={`h-4 w-4 ${
                  petFriendlyFree > 0 ? 'text-gold-700' : 'text-ink-500'
                }`}
              />
              {petFriendlyFree > 0
                ? `${pluralize(petFriendlyFree, 'pet-friendly room')} free`
                : 'No pet-friendly rooms for these dates'}
            </p>
          )}
          <ul
            className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-ink-700"
            aria-label="Highlights"
          >
            {CARD_AMENITIES.map((amenity) => (
              <li key={amenity.label} className="flex items-center gap-2">
                <Icon name={amenity.icon} className="h-4 w-4 text-gold-700" />
                {amenity.label}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href={room.href} className="link">
              Room details<span className="sr-only">: {room.name}</span>
            </Link>
            <button
              type="button"
              className="link"
              onClick={() => showModal(true)}
            >
              All amenities
            </button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-ink-100 pt-5 lg:w-52 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          {available ? (
            <>
              <div>
                <p className="leading-tight">
                  <span className="text-2xl font-semibold tabular-nums text-ink-900">
                    {formatPrice(room.price, { whole: true })}
                  </span>
                  <span className="text-sm text-ink-600"> / night</span>
                </p>
                {estimate && (
                  <>
                    <p className="mt-2 text-sm text-ink-700">
                      <span className="font-semibold tabular-nums text-ink-900">
                        {formatPrice(estimate.totalPrice)}
                      </span>{' '}
                      total
                    </p>
                    <p className="text-xs text-ink-600">
                      {pluralize(estimate.nightsCount, 'night')}, incl. taxes
                    </p>
                    {estimate.discount > 0 && (
                      <Badge tone="success" className="mt-2">
                        <Icon name="tag" className="h-3.5 w-3.5" />
                        {estimate.discount}% long-stay discount
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {actionUnavailable ? (
                <p className="text-sm text-ink-700">{actionUnavailable}</p>
              ) : (
                <Button
                  onClick={() => reservationHandler(room.typeId)}
                  fullWidth
                  iconRight="arrow-right"
                  aria-describedby={titleId}
                >
                  {actionLabel}
                </Button>
              )}
            </>
          ) : (
            <div className="text-sm text-ink-700">
              <p className="font-semibold text-ink-900">Not available</p>
              <p className="mt-1">
                Every {room.name} is booked for these dates. Try moving your
                stay by a day or two.
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default RoomReservationCard;
