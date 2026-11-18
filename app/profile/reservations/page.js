'use client';

import ProfileReservationCard from '@/components/cards/ProfileReservationCard';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/context/ToastContext';
import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
import { handleError } from '@/lib/toast/handleError';
import { handleSuccess } from '@/lib/toast/handleSuccess';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ProfileReservations = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);

  const bookingHandler = (reservationDetails) => {
    router.replace(
      `/booking?resId=${reservationDetails.id}&bId=${reservationDetails.bookingId}`
    );
  };

  const cancelReservation = async (reservationDetails) => {
    setShowSpinner(true);

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
        handleError(
          showToast,
          `Failed to cancel reservation: ${response.statusText}`
        );
        return;
      }

      const data = await response.json();
      handleSuccess(showToast, data.message);
      getReservations();
    } catch (error) {
      console.error(error.message);
    } finally {
      setShowSpinner(false);
    }
  };

  const getReservations = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(
        `/api/rooms/reserve/profile?bookingStatus=${RESERVATION_STATUS.RESERVED}&userId=${user.uid}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        console.error(`Error: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      setReservations(data.reservations);
      setIsFetching(false);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
      setIsFetching(false);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    getReservations();
  }, []);

  return (
    <section aria-labelledby="list-title" aria-busy={isFetching}>
      <div className="mb-6">
        <h2
          id="list-title"
          className="font-display text-2xl font-semibold text-ink-900"
        >
          Awaiting payment
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Reservations are held for 1 hour. Pay to confirm them, or cancel for
          free.
        </p>
      </div>
      {isFetching ? (
        <LoadingState label="Loading…" className="card min-h-[240px]" />
      ) : reservations.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {reservations.map((reservation) => (
            <li key={reservation.id}>
              <ProfileReservationCard
                res={reservation}
                bookingHandler={bookingHandler}
                cancelReservation={cancelReservation}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="clock"
          title="No reservations awaiting payment"
          action={
            <Button href="/make-reservation" icon="calendar">
              Book a room
            </Button>
          }
        >
          When you reserve a room, it appears here until you pay for it.
        </EmptyState>
      )}
      {showSpinner && <LoadingState overlay label="Cancelling…" />}
    </section>
  );
};

export default ProfileReservations;
