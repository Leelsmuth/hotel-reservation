'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

const CARDS = [
  {
    href: '/profile/reservations',
    icon: 'clock',
    title: 'Awaiting payment',
    text: 'Reservations we are holding for you. Pay to confirm them, or cancel for free.',
  },
  {
    href: '/profile/bookings',
    icon: 'calendar',
    title: 'Confirmed bookings',
    text: 'Paid bookings for upcoming stays. View the details or cancel.',
  },
  {
    href: '/profile/change-password',
    icon: 'key',
    title: 'Password',
    text: 'Keep your account secure.',
  },
];

const Profile = () => {
  return (
    <div className="space-y-8">
      <h2 className="sr-only">Overview</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200">
                <Icon name={card.icon} className="h-5 w-5" />
              </span>
              <span className="mt-4 flex items-center justify-between gap-2 font-semibold text-ink-900">
                {card.title}
                <Icon
                  name="arrow-right"
                  className="h-4 w-4 text-ink-500 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-900"
                />
              </span>
              <span className="mt-1 text-sm text-ink-600">{card.text}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="on-dark flex flex-col items-start gap-4 rounded-2xl bg-ink-900 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">
            Planning another stay?
          </h2>
          <p className="mt-1 text-ink-200">
            Check live availability and see the total price for your dates.
          </p>
        </div>
        <Button href="/make-reservation" size="lg" icon="calendar">
          Book a room
        </Button>
      </div>
    </div>
  );
};

export default Profile;
