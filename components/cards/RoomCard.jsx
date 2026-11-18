import Image from 'next/image';
import Link from 'next/link';
import Icon from '../ui/Icon';
import { CARD_AMENITIES } from '@/lib/static/roomCatalog';
import { formatPrice } from '@/lib/helpers/formatters';

/**
 * Room type card for listings. Every card uses the photos' native 3:2 ratio
 * so images line up and aren't cropped differently. The whole card is
 * clickable (stretched link on the title) with a single tab stop.
 */
const RoomCard = ({
  room,
  headingLevel = 'h3',
  showAmenities = true,
  priority = false,
}) => {
  const Heading = headingLevel;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition duration-200 focus-within:ring-2 focus-within:ring-gold-700 focus-within:ring-offset-2 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[3/2] overflow-hidden bg-ink-100">
        <Image
          src={room.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="pb-5">
          <Heading className="font-display text-xl font-semibold text-ink-900">
            <Link
              href={room.href}
              className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
            >
              {room.name}
            </Link>
          </Heading>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
            <Icon name="users" className="h-4 w-4" />
            Up to {room.maxGuests} guests
          </p>
          {showAmenities && (
            <ul
              className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-700"
              aria-label="Highlights"
            >
              {CARD_AMENITIES.slice(0, 3).map((amenity) => (
                <li key={amenity.label} className="flex items-center gap-1.5">
                  <Icon name={amenity.icon} className="h-4 w-4 text-gold-700" />
                  {amenity.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink-100 pt-4">
          <p className="leading-tight">
            <span className="text-2xl font-semibold tabular-nums text-ink-900">
              {formatPrice(room.price, { whole: true })}
            </span>
            <span className="text-sm text-ink-600"> / night</span>
            <span className="block text-xs text-ink-600">before taxes</span>
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gold-700 group-hover:text-ink-900">
            View room
            <Icon
              name="arrow-right"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </article>
  );
};

export default RoomCard;
