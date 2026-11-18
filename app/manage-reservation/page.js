'use client';

import ConfirmationModal from '@/components/toast/ConfirmationModal ';
import RoomDetailsModal from '@/components/toast/RoomDetailsModal';
import Container from '@/components/layout/Container';
import PageHeader from '@/components/ui/PageHeader';
import StaySummary from '@/components/booking/StaySummary';
import BookingPolicies from '@/components/booking/BookingPolicies';
import { TextField } from '@/components/forms/Field';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import LoadingState from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthProvider';
import { useBooking } from '@/context/BookingContext';
import { useToast } from '@/context/ToastContext';
import {
  RESERVATION_STATUS,
  ROOM_MAIN_PICTURES,
  ROOM_TYPES_NAMES,
} from '@/lib/static/roomLegend';
import { getRoomByType } from '@/lib/static/roomCatalog';
import { handleError } from '@/lib/toast/handleError';
import { handleSuccess } from '@/lib/toast/handleSuccess';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const ManageReservation = () => {
  const router = useRouter();
  const { updateIsGuest, updateUserId } = useBooking();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isFetching, setIsFetching] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(true);
  const [showMorePerks, setShowMorePerks] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const bookingId = useRef(null);
  const email = useRef(null);

  const openModal = (isBooking) => {
    setIsBooking(isBooking);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const getReservationDetails = async (e) => {
    e.preventDefault();

    try {
      setIsFetching(true);
      setError('');
      const response = await fetch(
        `/api/rooms/reserve?bookingId=${encodeURIComponent(
          bookingId.current.value.trim()
        )}&email=${encodeURIComponent(email.current.value.trim())}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setReservationDetails(null);
          setIsFetching(false);
          setError(
            'No reservation found matching the search criteria. Please check and try again.'
          );
          return;
        }
        setReservationDetails(null);
        setIsFetching(false);
        setError(
          `We couldn't look up your booking right now (${response.status} ${response.statusText}). Please try again.`
        );
        return;
      }

      const data = await response.json();
      if (
        data.reservation.bookingStatus === RESERVATION_STATUS.CHECKEDIN ||
        data.reservation.bookingStatus === RESERVATION_STATUS.CHECKEDOUT
      ) {
        setReservationDetails(null);
        setIsFetching(false);
        setError(
          'No reservation found matching the search criteria. Please check and try again.'
        );
        return;
      }

      setReservationDetails(data.reservation);
      setIsFetching(false);

      bookingId.current.value = '';
      email.current.value = '';
    } catch (error) {
      setError('Oops! Something went wrong. Please try again!');
      console.error('Failed to fetch reservation:', error);
      setIsFetching(false);
    }
  };

  const bookingHandler = () => {
    if (user) {
      updateIsGuest(false);
      updateUserId(user.uid);
    }
    router.push(
      `/booking?resId=${reservationDetails.id}&bId=${reservationDetails.bookingId}`
    );
  };

  const handleBookingLogin = () => {
    const redirectUrl = `/booking?resId=${reservationDetails.id}&bId=${reservationDetails.bookingId}`;
    router.push(`/login?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  const handleBookingSignup = () => {
    const redirectUrl = `/booking?resId=${reservationDetails.id}&bId=${reservationDetails.bookingId}`;
    router.push(`/signup?redirectTo=${encodeURIComponent(redirectUrl)}`);
  };

  const cancelReservation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms/cancel-reservation', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationDetails.id,
          roomId: reservationDetails.roomId,
          bookedFrom: reservationDetails.bookingDates.bookedFrom,
          bookedUntil: reservationDetails.bookingDates.bookedUntil,
        }),
      });

      if (!response.ok) {
        setError(`Failed to cancel reservation: ${response.statusText}`);
        handleError(
          showToast,
          `Failed to cancel reservation: ${response.statusText}`
        );
        return;
      }

      const data = await response.json();

      if (isBooking) {
        await fetch('/api/send-confirmation-email/booking/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: reservationDetails.contactDetails.email,
            bookingDetails: reservationDetails,
          }),
        });
      } else {
        await fetch('/api/send-confirmation-email/reservation/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: reservationDetails.contactDetails.email,
            bookingDetails: reservationDetails,
          }),
        });
      }

      handleSuccess(showToast, data.message);
      router.push('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const status = reservationDetails?.bookingStatus;
  const statusBadge =
    status === RESERVATION_STATUS.RESERVED ? (
      <Badge tone="warning">Awaiting payment</Badge>
    ) : status === RESERVATION_STATUS.BOOKED ? (
      <Badge tone="success">
        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
        Paid &amp; confirmed
      </Badge>
    ) : status === RESERVATION_STATUS.CANCELLED ? (
      <Badge tone="neutral">Cancelled</Badge>
    ) : null;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Manage booking' },
        ]}
        eyebrow="Manage booking"
        title="Find your booking"
        description="Look up a reservation or booking with your booking ID and the email you used. You can pay for it or cancel it here."
      />

      <Container classes="py-10 sm:py-12 lg:pb-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <form
              onSubmit={getReservationDetails}
              className="card space-y-5 p-5 sm:p-6"
              aria-labelledby="lookup-title"
            >
              <h2
                id="lookup-title"
                className="font-display text-xl font-semibold text-ink-900"
              >
                Look up a booking
              </h2>
              <TextField
                id="lookup-booking-id"
                label="Booking ID"
                hint="The 10-character code in your confirmation email."
                type="text"
                required
                inputRef={bookingId}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputClassName="font-mono uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
              />
              <TextField
                id="lookup-email"
                label="Email"
                type="email"
                required
                inputRef={email}
                autoComplete="email"
              />
              <Button
                type="submit"
                size="lg"
                fullWidth
                icon="search"
                loading={isFetching === true}
                loadingText="Searching…"
              >
                Find booking
              </Button>
            </form>
            {user && (
              <p className="mt-4 px-1 text-sm text-ink-600">
                Signed in? All your reservations and bookings are in{' '}
                <Link href="/profile" className="link">
                  My account
                </Link>
                .
              </p>
            )}
          </div>

          <div aria-live="polite">
            {isFetching === true ? (
              <LoadingState
                label="Looking up your booking…"
                className="card min-h-[320px]"
              />
            ) : isFetching === false && !reservationDetails && error ? (
              <Alert tone="error" title="Booking not found">
                {error}
              </Alert>
            ) : isFetching === false && reservationDetails ? (
              <div className="space-y-6">
                {status === RESERVATION_STATUS.RESERVED && (
                  <Alert tone="warning" title="This reservation isn't paid yet">
                    Reservations are held for 1 hour. Pay now to confirm your
                    booking.
                  </Alert>
                )}
                {status === RESERVATION_STATUS.CANCELLED && (
                  <Alert tone="neutral" title="This reservation was cancelled">
                    The room has been released. You're welcome to make a new
                    reservation.
                  </Alert>
                )}

                <StaySummary
                  heading="Your stay"
                  room={
                    getRoomByType(reservationDetails.roomTypeId) ?? {
                      name: ROOM_TYPES_NAMES[reservationDetails.roomTypeId],
                      image: ROOM_MAIN_PICTURES[reservationDetails.roomTypeId],
                    }
                  }
                  badge={statusBadge}
                  checkIn={reservationDetails.bookingDates.bookedFrom}
                  checkOut={reservationDetails.bookingDates.bookedUntil}
                  nights={reservationDetails.nightsCount}
                  guests={reservationDetails.guestCount}
                  bookingId={reservationDetails.bookingId}
                  price={{
                    roomPrice: reservationDetails.roomPrice,
                    nights: reservationDetails.nightsCount,
                    discount: reservationDetails.discount,
                    discountAmount: reservationDetails.discountAmount,
                    tax: reservationDetails.tax,
                    total: reservationDetails.totalPrice,
                    totalLabel:
                      status === RESERVATION_STATUS.BOOKED
                        ? 'Total paid (CAD)'
                        : 'Total (CAD)',
                  }}
                />

                {status === RESERVATION_STATUS.RESERVED && (
                  <section
                    aria-labelledby="pay-title"
                    className="card p-5 sm:p-6"
                  >
                    <h2
                      id="pay-title"
                      className="font-display text-xl font-semibold text-ink-900"
                    >
                      Pay to confirm your booking
                    </h2>
                    {user ? (
                      <Button
                        size="lg"
                        fullWidth
                        className="mt-4"
                        onClick={bookingHandler}
                        iconRight="arrow-right"
                      >
                        Continue to payment
                      </Button>
                    ) : (
                      <div className="mt-4 space-y-4">
                        <Button
                          size="lg"
                          fullWidth
                          onClick={bookingHandler}
                          iconRight="arrow-right"
                        >
                          Continue to payment as a guest
                        </Button>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Button
                            variant="secondary"
                            onClick={handleBookingLogin}
                          >
                            Log in
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={handleBookingSignup}
                          >
                            Create an account
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="mt-6 flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-ink-600">
                        Changed your plans? Cancelling an unpaid reservation is
                        free.
                      </p>
                      <Button
                        variant="danger-outline"
                        size="sm"
                        onClick={() => openModal(false)}
                      >
                        Cancel reservation
                      </Button>
                    </div>
                  </section>
                )}

                {status === RESERVATION_STATUS.BOOKED && (
                  <section
                    aria-labelledby="cancel-title"
                    className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >
                    <div>
                      <h2
                        id="cancel-title"
                        className="font-semibold text-ink-900"
                      >
                        Need to cancel?
                      </h2>
                      <p className="mt-1 text-sm text-ink-600">
                        A 30% cancellation fee applies; 70% of what you paid is
                        refunded.
                      </p>
                    </div>
                    <Button
                      variant="danger-outline"
                      onClick={() => openModal(true)}
                    >
                      Cancel booking
                    </Button>
                  </section>
                )}

                <section
                  aria-labelledby="included-title"
                  className="card p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2
                      id="included-title"
                      className="font-display text-xl font-semibold text-ink-900"
                    >
                      Policies & what's included
                    </h2>
                    <button
                      type="button"
                      className="link text-sm"
                      onClick={() => setIsRoomModalOpen(true)}
                    >
                      See all amenities
                    </button>
                  </div>
                  <BookingPolicies compact className="mt-5" />
                </section>

                <RoomDetailsModal
                  isOpen={isRoomModalOpen}
                  onClose={() => setIsRoomModalOpen(false)}
                />
                <ConfirmationModal
                  isOpen={isModalOpen}
                  onClose={closeModal}
                  onConfirm={cancelReservation}
                  isBooking={isBooking}
                  price={reservationDetails.totalPrice}
                />
              </div>
            ) : (
              <EmptyState icon="search" title="Your booking will appear here">
                Enter your booking ID and email to see your dates, price and
                options. Your booking ID is in the confirmation email we sent
                you.
              </EmptyState>
            )}
          </div>
        </div>
      </Container>
      {loading && <LoadingState overlay label="Cancelling…" />}
    </>
  );
};

export default ManageReservation;
