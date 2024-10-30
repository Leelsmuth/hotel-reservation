'use client';

import Spinner from '@/components/anim/Spinner';
import ProfileReservationCard from '@/components/cards/ProfileReservationCard';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/context/ToastContext';
import { RESERVATION_STATUS } from '@/lib/static/roomLegend';
import { handleError } from '@/lib/toast/handleError';
import { handleSuccess } from '@/lib/toast/handleSuccess';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

const ProfileBookings = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reservations, setReservations] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showSpinner, setShowSpinner] = useState(false);

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
          `Failed to cancel booking: ${response.statusText}`
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
        `/api/rooms/reserve/profile?bookingStatus=${RESERVATION_STATUS.BOOKED}&userId=${user.uid}`,
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
      console.error('Failed to fetch bookings:', error);
      setIsFetching(false);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    getReservations();
  }, []);

  return (
    <Fragment>
      {!isFetching && (
        <>
          {reservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map((reservation) => (
                <ProfileReservationCard
                  key={reservation.id}
                  res={reservation}
                  cancelReservation={cancelReservation}
                />
              ))}
            </div>
          ) : (
            <div>No reservation found.</div>
          )}
        </>
      )}
      {(isFetching || showSpinner) && (
        <div className="min-h-screen flex justify-center items-center max-w-screen-lg mx-auto fixed inset-0">
          <Spinner
            spinnerColor="text-primary"
            spinnerHeight="h-1/5"
            spinnerWidth="w-1/5"
          />
        </div>
      )}
    </Fragment>
  );
};

export default ProfileBookings;
