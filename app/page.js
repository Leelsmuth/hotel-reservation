'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import { searchToQuery } from '@/lib/booking/searchQuery';
import Container from '@/components/layout/Container';
import MainLayout from '@/components/layout/MainLayout';
import RoomGrid from '@/components/cards/RoomGrid';
import DiscountTiers from '@/components/booking/DiscountTiers';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import {
  HOTEL_FACILITIES,
  LOWEST_NIGHTLY_RATE,
} from '@/lib/static/roomCatalog';
import { TAX_PERCENTAGE } from '@/lib/pricing/bookingPrice';
import { formatPrice } from '@/lib/helpers/formatters';

const STEPS = [
  {
    icon: 'calendar',
    title: 'Pick your dates',
    text: 'Search your stay and see which rooms are free, with the total price for your dates.',
  },
  {
    icon: 'clock',
    title: 'Reserve for free',
    text: 'Choose a room and add your contact details. We hold it for you for 1 hour, nothing to pay yet.',
  },
  {
    icon: 'credit-card',
    title: 'Pay to confirm',
    text: 'Pay securely online, as a guest or with an account. Your confirmation arrives by email.',
  },
];

const Home = () => {
  const router = useRouter();

  // The results page runs the search from the web address
  const fetchAvailableRooms = (checkIn, checkOut, party) => {
    router.push(
      `/make-reservation?${searchToQuery({ checkIn, checkOut, party })}`
    );
  };

  return (
    <MainLayout>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-ink-900"
        aria-labelledby="hero-title"
      >
        <Image
          src="/exterior.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        {/* Scrim keeps the white text above 4.5:1 over any part of the photo */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/90 via-ink-900/60 to-ink-900/40 md:bg-gradient-to-r md:from-ink-900/85 md:via-ink-900/55 md:to-ink-900/10"
        />
        <Container classes="on-dark pb-36 pt-16 sm:pb-40 sm:pt-24 lg:pb-48 lg:pt-28">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
              Beverly Hills Hotel · Toronto
            </p>
            <h1
              id="hero-title"
              className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Forget busy work, start your next vacation
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-100">
              We provide what you need to enjoy your holiday with family. Rooms
              from {formatPrice(LOWEST_NIGHTLY_RATE, { whole: true })} a night,
              free to reserve.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#search" size="lg" iconRight="arrow-right">
                Check availability
              </Button>
              <Button href="/rooms" size="lg" variant="light">
                Explore rooms
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Search card overlapping the hero */}
      <Container classes="relative z-10 -mt-24 sm:-mt-28">
        <section
          id="search"
          aria-labelledby="search-title"
          className="rounded-2xl border border-ink-100 bg-white p-5 shadow-lift sm:p-6"
        >
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2
              id="search-title"
              className="font-display text-xl font-semibold text-ink-900"
            >
              Find your stay
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-ink-600">
              <Icon name="shield" className="h-4 w-4 text-gold-700" />
              Free to reserve · we hold your room for 1 hour
            </p>
          </div>
          <CustomDateRangePicker fetchAvailableRooms={fetchAvailableRooms} />
        </section>
      </Container>

      {/* How booking works */}
      <section aria-labelledby="how-title" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            id="how-title"
            eyebrow="How it works"
            title="Book in three simple steps"
            align="center"
          />
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="card relative p-6">
                <span
                  className="absolute right-5 top-4 font-display text-5xl font-semibold text-sand-200"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200">
                  <Icon name={step.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink-900">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-ink-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Rooms */}
      <section
        aria-labelledby="rooms-title"
        className="bg-sand-50 py-16 sm:py-20"
      >
        <Container>
          <SectionHeading
            id="rooms-title"
            eyebrow="Stay with us"
            title="Our rooms"
            description="Every room sleeps up to 4 adults (6 guests with children) and includes Wi‑Fi, a private bathroom and a dining area. Pet-friendly rooms available."
            link={{ href: '/rooms', label: 'Compare all rooms' }}
          />
          <RoomGrid />
        </Container>
      </section>

      {/* Long-stay pricing */}
      <section aria-labelledby="save-title" className="py-16 sm:py-20">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div>
              <p className="eyebrow mb-2">Transparent pricing</p>
              <h2
                id="save-title"
                className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl"
              >
                Stay longer, save more
              </h2>
              <p className="mt-3 text-ink-600">
                You pay the nightly rate of your room for each night, plus{' '}
                {TAX_PERCENTAGE}% tax. Longer stays get a discount on every
                night, applied automatically. The full total is shown before you
                reserve.
              </p>
              <Button
                href="/rooms#pricing"
                variant="secondary"
                className="mt-6"
                iconRight="arrow-right"
              >
                How pricing works
              </Button>
            </div>
            <DiscountTiers />
          </div>
        </Container>
      </section>

      {/* Facilities */}
      <section
        aria-labelledby="facilities-title"
        className="border-t border-ink-100 py-16 sm:py-20 lg:pb-24"
      >
        <Container>
          <SectionHeading
            id="facilities-title"
            eyebrow="On site"
            title="Hotel facilities"
            description="Included for every guest during your stay."
          />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <p className="mt-0.5 text-sm text-ink-600">{facility.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </MainLayout>
  );
};

export default Home;
