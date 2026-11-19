'use client';

import ConfirmationModal from '@/components/toast/ConfirmationModal ';
import RoomDetailsModal from '@/components/toast/RoomDetailsModal';
import Container from '@/components/layout/Container';
import PageHeader from '@/components/ui/PageHeader';
import StaySummary from '@/components/booking/StaySummary';
import { staySummaryProps } from '@/components/booking/staySummaryProps';
import BookingPolicies from '@/components/booking/BookingPolicies';
import { TextField } from '@/components/forms/Field';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import LoadingState from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/context/ToastContext';
import {
  CANCELLATION_REASON,
  RESERVATION_STATUS,
} from '@/lib/static/roomLegend';
import { sumBookingPrices } from '@/lib/pricing/bookingPrice';
import { handleError } from '@/lib/toast/handleError';
import { handleSuccess } from '@/lib/toast/handleSuccess';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const ManageReservation = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isFetching, setIsFetching] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);
  // The rooms of the booking shown (one, or several booked together)
  const [bookingRooms, setBookingRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(true);
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
      // Rooms already checked in or out are dealt with at the front desk
      const rooms = (data.reservations ?? [data.reservation]).filter(
        (room) =>
          room.bookingStatus !== RESERVATION_STATUS.CHECKEDIN &&
          room.bookingStatus !== RESERVATION_STATUS.CHECKEDOUT
      );
      if (rooms.length === 0) {
        setReservationDetails(null);
        setIsFetching(false);
        setError(
          'No reservation found matching the search criteria. Please check and try again.'
        );
        return;
      }

      // Show the rooms still reserved or booked; if every room was
      // cancelled, show them as cancelled
      const activeRooms = rooms.filter(
        (room) =>
          room.bookingStatus === RESERVATION_STATUS.RESERVED ||
          room.bookingStatus === RESERVATION_STATUS.BOOKED
      );
      const shownRooms = activeRooms.length > 0 ? activeRooms : rooms;
      setBookingRooms(shownRooms);
      // Unpaid rooms first: paying starts from one of them
      setReservationDetails(
        shownRooms.find(
          (room) => room.bookingStatus === RESERVATION_STATUS.RESERVED
        ) ?? shownRooms[0]
      );
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
        // Cancels every room of the booking
        body: JSON.stringify({
          reservationId: reservationDetails.id,
          scope: 'booking',
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
      const emailDetails = {
        ...reservationDetails,
        ...bookingTotals,
        rooms: bookingRooms,
      };

      if (isBooking) {
        await fetch('/api/send-confirmation-email/booking/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: reservationDetails.contactDetails.email,
            bookingDetails: emailDetails,
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
            bookingDetails: emailDetails,
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

  // Any unpaid room makes the booking unpaid (rooms are paid for together)
  const status = bookingRooms.some(
    (room) => room.bookingStatus === RESERVATION_STATUS.RESERVED
  )
    ? RESERVATION_STATUS.RESERVED
    : reservationDetails?.bookingStatus;
  const isMultiRoom = bookingRooms.length > 1;
  // Cancelled because it wasn't paid within the hold
  const isExpired =
    status === RESERVATION_STATUS.CANCELLED &&
    bookingRooms.some(
      (room) => room.cancellationReason === CANCELLATION_REASON.EXPIRED
    );
  const bookingTotals =
    bookingRooms.length > 0 ? sumBookingPrices(bookingRooms) : null;
  const statusBadge =
    status === RESERVATION_STATUS.RESERVED ? (
      <Badge tone="warning">Awaiting payment</Badge>
    ) : status === RESERVATION_STATUS.BOOKED ? (
      <Badge tone="success">
        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />
        Paid &amp; confirmed
      </Badge>
    ) : status === RESERVATION_STATUS.CANCELLED ? (
      <Badge tone="neutral">
        {isExpired ? 'Cancelled · expired' : 'Cancelled'}
      </Badge>
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
                {status === RESERVATION_STATUS.CANCELLED &&
                  (isExpired ? (
                    <Alert
                      tone="neutral"
                      title="This reservation expired"
                      action={
                        <Button size="sm" href="/make-reservation">
                          Book again
                        </Button>
                      }
                    >
                      It wasn't paid within 1 hour, so it was cancelled and{' '}
                      {isMultiRoom ? 'the rooms were' : 'the room was'}{' '}
                      released. You haven't been charged.
                    </Alert>
                  ) : (
                    <Alert
                      tone="neutral"
                      title="This reservation was cancelled"
                    >
                      {isMultiRoom ? 'The rooms have' : 'The room has'} been
                      released. You're welcome to make a new reservation.
                    </Alert>
                  ))}

                <StaySummary
                  heading="Your stay"
                  {...staySummaryProps(bookingRooms, {
                    totalLabel:
                      status === RESERVATION_STATUS.BOOKED
                        ? 'Total paid (CAD)'
                        : 'Total (CAD)',
                  })}
                  badge={statusBadge}
                  bookingId={reservationDetails.bookingId}
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
                        {isMultiRoom &&
                          ` All ${bookingRooms.length} rooms are cancelled together.`}
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
                        {isMultiRoom &&
                          ` All ${bookingRooms.length} rooms are cancelled together.`}
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
                  price={bookingTotals?.totalPrice}
                  roomCount={bookingRooms.length}
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
