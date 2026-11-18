import Image from 'next/image';
import Link from 'next/link';
import Icon from '../ui/Icon';
import { BrandMark } from './Header';

const BENEFITS = [
  'See all your reservations and bookings in one place',
  'Pay for a reservation in a couple of clicks',
  'Cancel online, any time',
];

/**
 * Two-column layout for login, sign-up and password pages: form on the
 * right, hotel photo with the account benefits on the left (large screens).
 */
const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="grid grid-cols-1 min-h-svh lg:grid-cols-2">
      <aside
        aria-label="Why create an account"
        className="on-dark relative hidden overflow-hidden bg-ink-900 lg:block"
      >
        <Image
          src="/banner.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/50 to-ink-900/30"
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link
            href="/"
            className="self-start rounded-md"
            aria-label="Beverly Hills Hotel, home"
          >
            <Image
              src="/bhh-logo-transparent.png"
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
            />
          </Link>
          <div className="max-w-md">
            <h2 className="font-display text-4xl font-semibold leading-tight text-white">
              Your stay, all in one place
            </h2>
            <ul className="mt-6 space-y-3 text-ink-100">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-ink-900">
                    <Icon
                      name="check"
                      className="h-3.5 w-3.5"
                      strokeWidth={2.5}
                    />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-ink-100 px-4 py-4 sm:px-8 lg:border-0">
          <Link href="/" className="rounded-md lg:invisible">
            <BrandMark />
            <span className="sr-only">: home</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-ink-700 hover:text-ink-900"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
            Back to site
          </Link>
        </header>
        <main
          id="main-content"
          className="flex flex-1 items-start justify-center px-4 py-10 sm:px-8 lg:items-center"
        >
          <div className="w-full max-w-md">
            {title && (
              <div className="mb-8">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                  {title}
                </h1>
                {subtitle && <p className="mt-2 text-ink-600">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
