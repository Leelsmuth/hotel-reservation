'use client';

import Container from '@/components/layout/Container';
import BookingSteps from '@/components/booking/BookingSteps';
import SuccessPanel from '@/components/booking/SuccessPanel';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthProvider';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const NEXT_STEPS = [
  {
    icon: 'mail',
    title: 'Check your inbox',
    text: 'A confirmation email with your booking details is on its way.',
  },
  {
    icon: 'key',
    title: 'Check in at the front desk',
    text: 'Give your booking ID at the front desk when you arrive.',
  },
  {
    icon: 'receipt',
    title: 'Need to cancel?',
    text: 'Cancelling a paid booking incurs a 30% fee; 70% is refunded.',
  },
];

const BookingConfirmation = () => {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [reservationCode, setReservationCode] = useState('');

  useEffect(() => {
    const bId = searchParams.get('bId');

    if (bId) {
      setReservationCode(bId);
    }
  }, [searchParams]);

  return (
    <div className="bg-sand-50/60 pb-16 sm:pb-20">
      <Container classes="pt-8 sm:pt-10">
        <BookingSteps current={5} className="mb-10" />
        <SuccessPanel
          title="Your booking is confirmed"
          intro="Thank you! Your payment was successful and your room is booked. We look forward to welcoming you."
          bookingId={reservationCode}
        >
          <h2 className="font-display text-xl font-semibold text-ink-900">
            What happens next
          </h2>
          <ul className="mt-5 space-y-5">
            {NEXT_STEPS.map((step) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200">
                  <Icon name={step.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-ink-900">{step.title}</p>
                  <p className="text-sm text-ink-600">{step.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-ink-100 pt-6 sm:grid-cols-2">
            <Button
              href={user ? '/profile/bookings' : '/manage-reservation'}
              variant="secondary"
              size="lg"
            >
              {user ? 'View my bookings' : 'Manage my booking'}
            </Button>
            <Button href="/" size="lg" icon="home">
              Back to home
            </Button>
          </div>
        </SuccessPanel>
      </Container>
    </div>
  );
};

export default BookingConfirmation;
