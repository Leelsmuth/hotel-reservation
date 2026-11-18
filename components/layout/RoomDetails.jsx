import Image from 'next/image';
import Container from './Container';
import RoomGrid from '../cards/RoomGrid';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import DiscountTiers from '../booking/DiscountTiers';
import {
  getRoomByKey,
  HOTEL_FACILITIES,
  ROOM_AMENITIES,
} from '@/lib/static/roomCatalog';
import { TAX_PERCENTAGE } from '@/lib/pricing/bookingPrice';
import { formatPrice } from '@/lib/helpers/formatters';

/**
 * Room type page: gallery, description, amenities and a booking card with
 * the nightly rate and how the total is worked out.
 * `name` is the room's image key: "queen", "king", "deluxe", "presidential".
 */
const RoomDetails = ({ name }) => {
  const room = getRoomByKey(name);
  if (!room) return null;

  const [main, top, bottom] = room.gallery;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Rooms', href: '/rooms' },
          { label: room.name },
        ]}
        eyebrow="Room details"
        title={room.name}
        description={
          <span className="flex flex-wrap items-center gap-x-5 gap-y-1 text-base">
            <span className="flex items-center gap-1.5">
              <Icon name="users" className="h-5 w-5 text-gold-700" />
              Up to {room.maxGuests} guests
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="bed" className="h-5 w-5 text-gold-700" />1 bedroom
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="bath" className="h-5 w-5 text-gold-700" />1 bathroom
            </span>
          </span>
        }
      />

      <Container classes="pt-8 sm:pt-10">
        {/* Gallery: all photos at their native 3:2 ratio */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-ink-100 sm:col-span-2 sm:aspect-auto sm:h-full">
            <Image
              src={main}
              alt={`${room.name}: bedroom`}
              fill
              priority
              sizes="(min-width: 1280px) 820px, (min-width: 640px) 66vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-4">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-ink-100">
              <Image
                src={top}
                alt={`${room.name}: another view of the room`}
                fill
                sizes="(min-width: 1280px) 400px, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-ink-100">
              <Image
                src={bottom}
                alt={`${room.name}: room detail`}
                fill
                sizes="(min-width: 1280px) 400px, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          {/* Booking card: first in reading order (right-hand column on large screens) */}
          <aside
            aria-labelledby="rate-title"
            className="lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:self-start"
          >
            <div className="card p-6">
              <h2 id="rate-title" className="sr-only">
                Rate and booking
              </h2>
              <p className="leading-tight">
                <span className="font-display text-4xl font-semibold text-ink-900">
                  {formatPrice(room.price, { whole: true })}
                </span>
                <span className="text-ink-600"> / night</span>
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Per room, for up to {room.maxGuests} guests. {TAX_PERCENTAGE}%
                tax added.
              </p>

              <Button
                href="/make-reservation"
                size="lg"
                fullWidth
                className="mt-5"
                icon="calendar"
              >
                Check availability
              </Button>
              <p className="mt-3 text-center text-xs text-ink-600">
                Free to reserve · we hold your room for 1 hour
              </p>

              <div className="mt-6 border-t border-ink-100 pt-5">
                <h3 className="text-sm font-semibold text-ink-900">
                  Long-stay discounts
                </h3>
                <DiscountTiers variant="list" className="mt-3" />
              </div>
            </div>
          </aside>

          <div className="space-y-12 lg:col-start-1 lg:row-start-1">
            <section aria-labelledby="about-title">
              <h2
                id="about-title"
                className="font-display text-2xl font-semibold text-ink-900"
              >
                About the room
              </h2>
              <div className="mt-4 max-w-prose space-y-4 text-ink-700">
                <p>
                  Located in the heart of Toronto, with breathtaking views of
                  the city, Beverly Hills Hotel offers a one-of-a-kind
                  experience with wonderful services and amenities. A hub for
                  both business and leisure. Our rooms are well equipped with a
                  private bathroom, flat-screen TV, AC/heating unit and a
                  refrigerator. Beverly Hills Hotel Restaurant offers delicious
                  continental and intercontinental cuisine and a fine dining
                  experience from our experienced chefs.
                </p>
                <p>
                  Experience an amazing atmosphere with great music, bar food,
                  mocktails and cocktails in our lounge and bar. Enjoy a
                  relaxing swim in our pools, feel refreshed after a workout in
                  our well-equipped gym, or unwind in our spa and sauna with
                  expert therapists. Beverly Hills Hotel is the perfect choice
                  for an unforgettable stay.
                </p>
              </div>
            </section>

            <section aria-labelledby="amenities-title">
              <h2
                id="amenities-title"
                className="font-display text-2xl font-semibold text-ink-900"
              >
                In your room
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ROOM_AMENITIES.map((amenity) => (
                  <li
                    key={amenity.label}
                    className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-sand-50 p-4 text-sm font-medium text-ink-800"
                  >
                    <Icon
                      name={amenity.icon}
                      className="h-6 w-6 text-gold-700"
                    />
                    {amenity.label}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="facilities-title">
              <h2
                id="facilities-title"
                className="font-display text-2xl font-semibold text-ink-900"
              >
                Hotel facilities
              </h2>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {HOTEL_FACILITIES.map((facility) => (
                  <li
                    key={facility.name}
                    className="card flex items-center gap-4 p-3"
                  >
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={facility.image}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-900">
                        {facility.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-ink-600">
                        {facility.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </Container>

      <section
        aria-labelledby="other-rooms-title"
        className="mt-16 border-t border-ink-100 bg-sand-50 py-14 sm:mt-20"
      >
        <Container>
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="other-rooms-title"
              className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl"
            >
              Compare other rooms
            </h2>
          </div>
          <RoomGrid exclude={room.typeId} columns={3} showAmenities={false} />
        </Container>
      </section>
    </>
  );
};

export default RoomDetails;
