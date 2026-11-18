import Image from 'next/image';
import Link from 'next/link';
import Container from './Container';
import Icon from '../ui/Icon';
import DiscountStrip from '../booking/DiscountStrip';

const EXPLORE = [
  { href: '/rooms', label: 'Rooms & rates' },
  { href: '/make-reservation', label: 'Check availability' },
  { href: '/manage-reservation', label: 'Manage a booking' },
  { href: '/about', label: 'About the hotel' },
];

const ACCOUNT = [
  { href: '/login', label: 'Log in' },
  { href: '/signup', label: 'Create an account' },
  { href: '/profile', label: 'My bookings' },
];

const FooterLinks = ({ title, links }) => (
  <div>
    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-300">
      {title}
    </h2>
    <ul className="mt-4 space-y-2.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="rounded text-ink-200 transition-colors hover:text-white hover:underline"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  return (
    <footer className="on-dark">
      <DiscountStrip />
      <div className="bg-ink-900 text-ink-200">
        <Container classes="py-14">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
            <div className="col-span-2 lg:col-span-1">
              <Link
                href="/"
                className="inline-block rounded-md"
                aria-label="Beverly Hills Hotel, home"
              >
                <Image
                  src="/bhh-logo-transparent.png"
                  alt=""
                  width={88}
                  height={88}
                  className="h-20 w-20 object-contain"
                />
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-300">
                A calm, central base in Toronto for business and leisure, with a
                restaurant, pool, gym and spa on site.
              </p>
            </div>
            <FooterLinks title="Explore" links={EXPLORE} />
            <FooterLinks title="Your account" links={ACCOUNT} />
            <div className="col-span-2 lg:col-span-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold-300">
                Contact
              </h2>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="tel:555555555"
                    className="flex items-center gap-3 rounded hover:text-white"
                  >
                    <Icon name="phone" className="h-5 w-5 text-gold-300" />
                    555 555 555
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:example@email.ca"
                    className="flex items-center gap-3 rounded hover:text-white"
                  >
                    <Icon name="mail" className="h-5 w-5 text-gold-300" />
                    example@email.ca
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="map-pin" className="h-5 w-5 text-gold-300" />
                  <address className="not-italic">
                    123 Hotel Ave, Toronto, ON
                  </address>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-ink-300 sm:flex-row sm:justify-between">
            <p>
              &copy; {new Date().getFullYear()} Beverly Hills Hotel. All rights
              reserved.
            </p>
            <p>Prices in Canadian dollars (CAD).</p>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
