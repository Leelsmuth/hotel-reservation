'use client';

import Spinner from '@/components/anim/Spinner';
import Container from '@/components/layout/Container';
import StyledButton from '@/components/ui/StyledButton';
import { RESERVATION_STATUS, ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const ManageReservation = () => {
  const router = useRouter();

  const [isFetching, setIsFetching] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bookingId = useRef(null);
  const email = useRef(null);

  const getReservationDetails = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(
        `/api/rooms/reserve?bookingId=${bookingId.current.value.trim()}&email=${email.current.value.trim()}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setReservationDetails(data.reservation);
      setIsFetching(false);
    } catch (error) {
      console.error('Failed to fetch reservation:', error);
      setIsFetching(false);
    }
  };

  const bookingHandler = () => {
    router.push(
      `/booking?resId=${reservationDetails.id}&bId=${reservationDetails.bookingId}`
    );
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
        throw new Error(`Failed to cancel reservation: ${response.statusText}`);
      }

      const data = await response.json();
      alert(data.message);
      router.push('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block">Booking/Reference ID</label>
          <input className="border w-full" type="text" ref={bookingId} />
        </div>
        <div>
          <label className="block">Email</label>
          <input className="border w-full" type="email" ref={email} />
        </div>
      </div>
      <div className="mx-auto w-max">
        <StyledButton btnText="Search" clickHandler={getReservationDetails} />
      </div>
      {isFetching === true && (
        <div className="min-h-screen text-center max-w-screen-lg mx-auto">
          <Spinner
            spinnerColor="text-primary"
            spinnerHeight="h-1/5"
            spinnerWidth="w-1/5"
          />
        </div>
      )}
      {isFetching === false && !reservationDetails && <div>{error}</div>}
      {isFetching === false && reservationDetails && (
        <div>
          <h1>{ROOM_TYPES_NAMES[reservationDetails.roomTypeId]}</h1>
          <div>${reservationDetails.roomPrice}/night</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              Check In
              <br /> {reservationDetails.bookingDates.bookedFrom}
            </div>
            <div>
              Check Out
              <br /> {reservationDetails.bookingDates.bookedUntil}
            </div>
          </div>
          <div className="mb-4">
            <div>
              No. of Occupants
              <br /> {reservationDetails.guestCount}
            </div>
          </div>
          {reservationDetails.guestDetails.map((detail, idx) => (
            <div key={idx}>
              <div> Occupant {idx + 1}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  Full Name <br /> {detail.name}
                </div>
                <div>
                  Age <br /> {detail.age}
                </div>
              </div>
            </div>
          ))}
          {reservationDetails.bookingStatus === RESERVATION_STATUS.RESERVED && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StyledButton
                btnText="Cancel Reservation"
                clickHandler={cancelReservation}
              />
              <StyledButton btnText="Book Now" clickHandler={bookingHandler} />
            </div>
          )}
          {reservationDetails.bookingStatus === RESERVATION_STATUS.BOOKED && (
            <div>
              <StyledButton
                btnText="Cancel Booking"
                clickHandler={cancelReservation}
              />
            </div>
          )}
          {reservationDetails.bookingStatus ===
            RESERVATION_STATUS.CANCELLED && <div>Cancelled</div>}
        </div>
      )}
      {loading && (
        <div className="min-h-screen flex justify-center items-center max-w-screen-lg mx-auto fixed inset-0">
          <Spinner
            spinnerColor="text-primary"
            spinnerHeight="h-1/5"
            spinnerWidth="w-1/5"
          />
        </div>
      )}
    </Container>
  );
};

export default ManageReservation;
