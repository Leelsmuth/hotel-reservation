import RoomGrid from '@/components/cards/RoomGrid';
import Container from '@/components/layout/Container';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import DiscountTiers from '@/components/booking/DiscountTiers';
import PricingExample from '@/components/booking/PricingExample';
import BookingPolicies from '@/components/booking/BookingPolicies';
import { TAX_PERCENTAGE } from '@/lib/pricing/bookingPrice';

const FACTS = [
  { icon: 'users', text: 'Every room sleeps up to 4 guests' },
  { icon: 'wifi', text: 'Wi‑Fi, TV and private bathroom included' },
  {
    icon: 'tag',
    text: `Nightly rate + ${TAX_PERCENTAGE}% tax, nothing hidden`,
  },
];

const Rooms = () => {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Rooms' }]}
        eyebrow="Rooms & rates"
        title="Find the right room for your stay"
        description="Compare our four room types at a glance. Prices are per room, per night. Check your dates to see what's available and the total for your stay."
        actions={
          <Button href="/make-reservation" size="lg" icon="calendar">
            Check availability
          </Button>
        }
      >
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-700">
          {FACTS.map((fact) => (
            <li key={fact.text} className="flex items-center gap-2">
              <Icon name={fact.icon} className="h-5 w-5 text-gold-700" />
              {fact.text}
            </li>
          ))}
        </ul>
      </PageHeader>

      <Container classes="py-12 sm:py-16">
        <h2 className="sr-only">Room types</h2>
        <RoomGrid headingLevel="h3" priority />
      </Container>

      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="scroll-mt-24 border-t border-ink-100 bg-sand-50 py-16 sm:py-20"
      >
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">Pricing & availability</p>
              <h2
                id="pricing-title"
                className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl"
              >
                How pricing works
              </h2>
              <div className="mt-4 max-w-prose space-y-4 text-ink-700">
                <p>
                  Each room type has a fixed nightly rate. Your total is the
                  nightly rate × the number of nights, minus any long-stay
                  discount, plus {TAX_PERCENTAGE}% tax. You'll always see the
                  full breakdown before you reserve and again before you pay.
                </p>
                <p>
                  Availability is checked live for the dates you search. If a
                  room type is fully booked for those dates it's shown as
                  unavailable; try moving your dates by a day or two.
                </p>
              </div>
              <h3 className="mt-8 text-lg font-semibold text-ink-900">
                Long-stay discounts
              </h3>
              <p className="mt-1 text-sm text-ink-600">
                Applied automatically to every night of your stay.
              </p>
              <DiscountTiers className="mt-4" />
            </div>
            <div className="space-y-6">
              <PricingExample />
              <div className="card p-5 sm:p-6">
                <h3 className="mb-4 font-display text-lg font-semibold text-ink-900">
                  Reserving, paying & cancelling
                </h3>
                <BookingPolicies />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
};

export default Rooms;
