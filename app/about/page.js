import Container from '@/components/layout/Container';
import MainLayout from '@/components/layout/MainLayout';
import HotelResort from '@/components/videos/HotelResort';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { HOTEL_FACILITIES } from '@/lib/static/roomCatalog';

export const metadata = {
  title: 'About | Beverly Hills Hotel',
  description: 'About Beverly Hills Hotel in Toronto',
};

const About = () => {
  return (
    <MainLayout>
      <section aria-labelledby="about-title" className="relative">
        <HotelResort className="max-h-[70vh] aspect-[16/9] sm:aspect-[21/9]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/30 to-transparent"
        />
        <Container classes="on-dark pointer-events-none absolute inset-x-0 bottom-0 pb-16 sm:pb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
            About us
          </p>
          <h1
            id="about-title"
            className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            We are Beverly Hills Hotel
          </h1>
        </Container>
      </section>

      <Container classes="py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
          <div className="max-w-prose space-y-6 text-ink-700">
            <p className="font-display text-2xl leading-relaxed text-ink-900">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt
              eius officia nemo tempore, facere deserunt dignissimos aliquid
              blanditiis ipsam ullam eaque sit nobis? Ratione, modi accusamus
              maxime quam omnis iste.
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt
              eius officia nemo tempore, facere deserunt dignissimos aliquid
              blanditiis ipsam ullam eaque sit nobis? Ratione, modi accusamus
              maxime quam omnis iste. Suscipit aperiam sint aspernatur, cum
              eligendi modi! Non delectus atque, harum vero nam voluptatem omnis
              quia suscipit possimus porro facilis.
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt
              eius officia nemo tempore, facere deserunt dignissimos aliquid
              blanditiis ipsam ullam eaque sit nobis? Ratione, modi accusamus
              maxime quam omnis iste. Suscipit aperiam sint aspernatur, cum
              eligendi modi! Non delectus atque, harum vero nam voluptatem omnis
              quia suscipit possimus porro facilis.
            </p>
          </div>
          <aside className="space-y-6">
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                On site
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-700">
                {HOTEL_FACILITIES.map((facility) => (
                  <li key={facility.name} className="flex items-center gap-2.5">
                    <Icon
                      name="check"
                      className="h-4 w-4 text-gold-700"
                      strokeWidth={2}
                    />
                    {facility.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Find us
              </h2>
              <address className="mt-3 flex items-start gap-2.5 text-sm not-italic text-ink-700">
                <Icon name="map-pin" className="h-5 w-5 text-gold-700" />
                123 Hotel Ave, Toronto, ON
              </address>
              <Button
                href="/make-reservation"
                fullWidth
                className="mt-5"
                icon="calendar"
              >
                Check availability
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </MainLayout>
  );
};

export default About;
