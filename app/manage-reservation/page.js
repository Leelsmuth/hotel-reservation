'use client';

import Spinner from '@/components/anim/Spinner';
import StyledButton from '@/components/ui/StyledButton';
import { RESERVATION_STATUS, ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { useRouter } from 'next/navigation';
import { Fragment, useRef, useState } from 'react';

const ManageReservation = () => {
  const router = useRouter();

  const [isFetching, setIsFetching] = useState(true);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bookingId = useRef(null);
  const email = useRef(null);

  const getReservationDetails = async () => {
    try {
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
      setReservationDetails(data);
      setIsFetching(false);
      console.log('Reservation Details:', data);
    } catch (error) {
      console.error('Failed to fetch reservation:', error);
      setIsFetching(false);
    }
  };

  const bookingHandler = () => {
    router.push(
      `/booking?resId=${reservationDetails.bookingId}&bId=${reservationDetails.reservationId}`
    );
  };

  const cancelReservation = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/reservation/cancel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: reservationDetails.id,
          roomId: parseInt(roomId, 10), // Convert roomId to number if it's in string format
          bookedFrom: reservationDetails.checkInDate,
          bookedUntil: reservationDetails.checkOutDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel reservation: ${response.statusText}`);
      }

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block">Booking/Reference ID</label>
          <input type="text" ref={bookingId} />
        </div>
        <div>
          <label className="block">Email</label>
          <input type="email" ref={email} />
        </div>
        <StyledButton btnText="Search" clickHandler={getReservationDetails} />
      </div>
      {isFetching ? (
        <div className="min-h-screen pb-5 md:pb-10 lg:pb-20 px-5 md:px-10 lg:px-28 font-[family-name:var(--font-manrope)] max-w-screen-lg mx-auto">
          {/* <div className="text-2xl font-medium">Loading...</div> */}
          <Spinner
            spinnerColor="text-primary"
            spinnerHeight="h-1/5"
            spinnerWidth="w-1/5"
          />
        </div>
      ) : (
        <div>
          <h1>{ROOM_TYPES_NAMES[reservationDetails.roomTypeId]}</h1>
          <div>${reservationDetails.roomPrice}/night</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"></div>
          <div className="mb-4"></div>
          {reservationDetails.guestDetails.map((detail, idx) => (
            <div>
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
    </Fragment>
  );
};

export default ManageReservation;
