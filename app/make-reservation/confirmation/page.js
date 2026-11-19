'use client';

import Container from '@/components/layout/Container';
import BookingSteps from '@/components/booking/BookingSteps';
import SuccessPanel from '@/components/booking/SuccessPanel';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const ReservationConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initializing } = useAuth();

  const [reservationId, setReservationId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const roomCount = Number(searchParams.get('rooms')) || 1;
  const isMultiRoom = roomCount > 1;

  const bookingHandler = () => {
    router.replace(`/booking?resId=${reservationId}&bId=${bookingId}`);
  };

  const handleBookingLogin = () => {
    const redirectUrl = `/booking?resId=${reservationId}&bId=${bookingId}`;
    router.push(`/login?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  const handleBookingSignup = () => {
    const redirectUrl = `/booking?resId=${reservationId}&bId=${bookingId}`;
    router.push(`/signup?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  useEffect(() => {
    const resId = searchParams.get('resId');
    const bId = searchParams.get('bId');

    if (resId) {
      setReservationId(resId);
    }
    if (bId) {
      setBookingId(bId);
    }
  }, [searchParams]);

  return (
    <div className="bg-sand-50/60 pb-16 sm:pb-20">
      <Container classes="pt-8 sm:pt-10">
        <BookingSteps current={3} className="mb-10" />
        <SuccessPanel
          title={
            isMultiRoom
              ? `Your ${roomCount} rooms are reserved`
              : 'Your room is reserved'
          }
          intro="We've emailed your reservation details. Keep your booking ID handy to manage your stay."
          bookingId={bookingId}
        >
          <Alert
            tone="warning"
            title="Pay within 1 hour to confirm your booking"
          >
            {isMultiRoom
              ? `We're holding your ${roomCount} rooms for 1 hour. You'll pay for all of them in one payment. If they aren't paid by then, the reservation is released and the rooms become available to others.`
              : "We're holding your room for 1 hour. If it isn't paid by then, the reservation is released and the room becomes available to others."}
          </Alert>

          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-ink-900">
              Next: payment
            </h2>
            {initializing ? (
              <div
                className="mt-4 h-12 animate-pulse rounded-lg bg-ink-100"
                aria-hidden="true"
              />
            ) : user ? (
              <div className="mt-4 space-y-3">
                <Button
                  size="lg"
                  fullWidth
                  onClick={bookingHandler}
                  iconRight="arrow-right"
                >
                  Continue to payment
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <Button
                  size="lg"
                  fullWidth
                  onClick={bookingHandler}
                  iconRight="arrow-right"
                >
                  Continue to payment as a guest
                </Button>
                <div className="relative text-center">
                  <span
                    className="absolute inset-x-0 top-1/2 h-px bg-ink-200"
                    aria-hidden="true"
                  />
                  <span className="relative bg-white px-3 text-sm text-ink-600">
                    or sign in to keep track of your bookings
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleBookingLogin}
                  >
                    Log in
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleBookingSignup}
                  >
                    Create an account
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-sm sm:flex-row">
            <Button href="/manage-reservation" variant="ghost" size="sm">
              Manage or cancel this reservation
            </Button>
            <Button href="/" variant="ghost" size="sm" icon="home">
              Back to home
            </Button>
          </div>
        </SuccessPanel>
      </Container>
    </div>
  );
};

export default ReservationConfirmation;
