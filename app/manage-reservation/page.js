'use client';

import Spinner from '@/components/anim/Spinner';
import RoomHomeCard from '@/components/cards/RoomHomeCard';
import Container from '@/components/layout/Container';
import ConfirmationModal from '@/components/toast/ConfirmationModal ';
import RoomDetailsModal from '@/components/toast/RoomDetailsModal';
import HeadingOne from '@/components/typography/HeadingOne';
import HeadingTwo from '@/components/typography/HeadingTwo';
import AltStyledButton from '@/components/ui/AltStyledButton';
import StyledButton from '@/components/ui/StyledButton';
import StyledLink from '@/components/ui/StyledLink';
import { useAuth } from '@/context/AuthProvider';
import { useBooking } from '@/context/BookingContext';
import {
  RESERVATION_STATUS,
  ROOM_MAIN_PICTURES,
  ROOM_TYPES_NAMES,
} from '@/lib/static/roomLegend';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Fragment, useRef, useState, useEffect } from 'react';

const ManageReservation = () => {
  const router = useRouter();
  const { updateIsGuest, updateUserId } = useBooking();
  const { user } = useAuth();

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
      const response = await fetch(
        `/api/rooms/reserve?bookingId=${bookingId.current.value.trim()}&email=${email.current.value.trim()}`,
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
        setError(`Error: ${response.statusText}`);
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
        return;
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

  useEffect(() => {
    getReservationDetails();
  }, []);

  return (
    <Container classes="min-h-[70vh]">
      <div className="text-right mt-14 mb-20">
        <StyledLink linkText="New Reservation" path="make-reservation" />
      </div>
      <HeadingOne classes="text-center mb-3 uppercase mt-8">
        Find Your reservation
      </HeadingOne>
      <div className="max-w-96 mx-auto mb-4">
        <form onSubmit={getReservationDetails}>
          <div className="mb-6">
            <label className="block text-lg">Booking/Reference ID</label>
            <input
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              type="text"
              required
              ref={bookingId}
            />
          </div>
          <div className="mb-6">
            <label className="block text-lg">Email</label>
            <input
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              type="email"
              required
              ref={email}
            />
          </div>
          <div className="mx-auto w-max">
            <StyledButton isSubmitBtn={true} btnText="Search" />
          </div>
        </form>
      </div>
      {isFetching === true && (
        <div className="mt-10 text-center max-w-screen-lg mx-auto flex justify-center">
          <Spinner
            spinnerColor="text-primary"
            spinnerHeight="h-1/5"
            spinnerWidth="w-1/5"
          />
        </div>
      )}
      {isFetching === false && !reservationDetails && (
        <div className="max-w-96 mx-auto mb-4 mt-10 uppercase font-semibold text-red-500 text-center">
          {error}
        </div>
      )}
      {isFetching === false && reservationDetails && (
        <Container>
          <div className="max-w-screen-md mx-auto">
            <hr />
            <div className="text-center text-4xl my-4">
              Reservation details{' '}
              <span className="text-primary">
                ({reservationDetails.bookingId})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6 text-center">
              <div>
                <div>Check in</div>
                <div className="text-primary text-xl underline">
                  {reservationDetails.bookingDates.bookedFrom}
                </div>
              </div>
              <div>
                <div>Check out</div>
                <div className="text-primary text-xl underline">
                  {reservationDetails.bookingDates.bookedUntil}
                </div>
              </div>
              <div>
                <div>Room & Guest</div>
                <div className="text-primary text-xl underline">
                  1 room, {reservationDetails.guestCount} guests
                </div>
              </div>
            </div>
            <hr />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-10 items-center">
              <div>
                <div className="text-center text-primary">
                  <h2 className="text-5xl font-bold">
                    {ROOM_TYPES_NAMES[reservationDetails.roomTypeId]}
                  </h2>
                  <div className="mb-5 text-3xl">
                    ${reservationDetails.roomPrice} per night
                  </div>
                </div>
                <div className="flex gap-6 mt-8 mb-3 flex-wrap justify-between items-center">
                  <div>
                    <Image
                      src="/amenities/icons/ic_bedroom.svg"
                      alt=""
                      height={32}
                      width={28}
                      className="w-auto object-contain"
                    />
                    <div className="mt-3">1 Bedroom</div>
                  </div>
                  <div className="flex gap-8 items-center text-primary h-full">
                    <Image
                      src="/amenities/icons/ionic-md-person.svg"
                      alt=""
                      height={60}
                      width={40}
                      className="object-cover h-full w-auto"
                    />
                    <div className="font-bold uppercase">Up to 4 guests</div>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl overflow-hidden">
                <Image
                  src={ROOM_MAIN_PICTURES[reservationDetails.roomTypeId]}
                  alt={ROOM_TYPES_NAMES[reservationDetails.roomTypeId]}
                  width={400}
                  height={350}
                  className="w-full"
                />
              </div>
            </div>
            <div className="text-2xl leading-8 text-neutral-500">
              <p className="mb-6">
                Oceanfront studios offering unparalleled beachfront living
                (530-565 sq. ft.)
              </p>
              <div>
                <div>WHAT’S INCLUDED? </div>
                <ul className="ms-4">
                  <li>Luxurious accomodations</li>
                  <li>Complimentary wireless internet access</li>
                </ul>
                <RoomDetailsModal
                  isOpen={isRoomModalOpen}
                  onClose={() => setIsRoomModalOpen(false)}
                />
                <button
                  type="button"
                  className="text-primary font-bold text-base uppercase my-6"
                  onClick={() => setIsRoomModalOpen(true)}
                >
                  View More +
                </button>
              </div>
              <hr />
              <div className="my-6">
                <h3 className="uppercase">Policies</h3>
                <div className="mb-5 text-black">
                  <h4 className="font-semibold">Guarantee Policy </h4>
                  <p className="text-xl">
                    Credit Card is required at the time of booking.
                  </p>
                </div>
                <div className="mb-10 text-black">
                  <h4 className="font-semibold">Cancel Policy</h4>
                  <p className="text-xl">
                    Customers can only reserve a room for 1hr with their email
                    address, or else they will forfeit the room. The hotel will
                    offer free cancellation up to 48 hours before check- in
                    otherwise a penalty charge of 30% on initial booking cost
                    will be applied.
                  </p>
                </div>
                <div>
                  <div className="grid grid-cols-2 mb-4">
                    <div>
                      {reservationDetails?.roomPrice} x{' '}
                      {reservationDetails?.nightsCount} nights
                    </div>
                    <div className="text-right">
                      $
                      {(
                        reservationDetails?.roomPrice *
                        reservationDetails?.nightsCount
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 mb-4">
                    <div>Taxes and fees</div>
                    <div className="text-right">
                      ${reservationDetails?.tax.toFixed(2)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 mb-4">
                    <div>Discount</div>
                    <div className="text-right">
                      ${reservationDetails?.discountAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <hr />
              <div className="my-6">
                <div className="mb-8">
                  <div className="grid grid-cols-2">
                    <div>Total CAD (Taxes included)</div>
                    <div className="text-right">
                      ${reservationDetails?.totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div>
                  {reservationDetails.bookingStatus ===
                    RESERVATION_STATUS.RESERVED && (
                    <div className="grid grid-cols-1 gap-4 max-w-[400px] mx-auto">
                      {user ? (
                        <StyledButton
                          btnText="Proceed to Booking"
                          clickHandler={bookingHandler}
                        />
                      ) : (
                        <div>
                          <div className="text-xl mb-2">
                            Proceed to Booking:
                          </div>
                          <div className=" flex flex-col gap-4 justify-center px-4">
                            <StyledButton
                              btnText="Existing customer? Login"
                              clickHandler={handleBookingLogin}
                            />
                            <AltStyledButton
                              btnText="New? Create account"
                              clickHandler={handleBookingSignup}
                            />
                            <StyledButton
                              btnText="Continue as Guest"
                              clickHandler={bookingHandler}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-alternate font-bold text-2xl text-center">
                        OR
                      </div>
                      <div className="*:w-full">
                        <AltStyledButton
                          btnText="Cancel Reservation"
                          clickHandler={() => openModal(false)}
                        />
                      </div>
                    </div>
                  )}
                  {reservationDetails.bookingStatus ===
                    RESERVATION_STATUS.BOOKED && (
                    <div className="max-w-[400px] mx-auto *:w-full">
                      <StyledButton
                        btnText="Cancel Booking"
                        clickHandler={() => openModal(true)}
                      />
                    </div>
                  )}
                  {reservationDetails.bookingStatus ===
                    RESERVATION_STATUS.CANCELLED && (
                    <div className="text-center uppercase font-bold bg-alternate text-white p-4 max-w-[400px] mx-auto *:w-full">
                      Reservation Cancelled
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ConfirmationModal
              isOpen={isModalOpen}
              onClose={closeModal}
              onConfirm={cancelReservation}
              isBooking={isBooking}
            />
          </div>
        </Container>
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
      <hr className="mt-16" />
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 uppercase">
          Check out our rooms
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RoomHomeCard
            imageName="deluxe-main"
            roomPath="deluxe-room"
            title="Deluxe Room"
            price="150"
          />
          <RoomHomeCard
            imageName="queen-main"
            roomPath="queen-room"
            title="Queen Room"
            price="120"
          />
          <RoomHomeCard
            imageName="king-main"
            roomPath="king-room"
            title="King Room"
            price="135"
          />
          <RoomHomeCard
            imageName="presidential-main"
            roomPath="presidential-suite"
            title="Presidential Suite"
            price="350"
          />
        </div>
      </div>
    </Container>
  );
};

export default ManageReservation;
