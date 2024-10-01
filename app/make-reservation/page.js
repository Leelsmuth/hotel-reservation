'use client';

import RoomReservation from '@/components/cards/RoomReservation';
import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import Container from '@/components/layout/Container';
import StyledButton from '@/components/ui/StyledButton';
import format from 'date-fns/format';
import { useBooking } from '@/context/BookingContext';
import generateReservationCode from '@/lib/helpers/generateReservationCode';
import { ROOM_TYPES_IDS, ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const MakeReservation = () => {
  const router = useRouter();
  const {
    bookingDetails,
    updateRoomSelection,
    updateGuestCount,
    updateRoomPrice,
    updateContactDetails,
    updateGuestDetails,
    resetBookingDetails,
  } = useBooking();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationData, setReservationData] = useState(null);
  const [error, setError] = useState(null);

  const [showingRoom, setShowingRoom] = useState(ROOM_TYPES_IDS.EXECUTIVE);
  const [showingSection, setShowingSection] = useState(1);
  const [availableRooms, setAvailableRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isFetchingRooms, setIsFetchingRooms] = useState(true);
  const [guestNameOne, setGuestNameOne] = useState('');
  const [guestAgeOne, setGuestAgeOne] = useState(1);
  const [guestNameTwo, setGuestNameTwo] = useState('');
  const [guestAgeTwo, setGuestAgeTwo] = useState(1);
  const [guestNameThree, setGuestNameThree] = useState('');
  const [guestAgeThree, setGuestAgeThree] = useState(1);
  const [guestNameFour, setGuestNameFour] = useState('');
  const [guestAgeFour, setGuestAgeFour] = useState(1);

  const contactName = useRef(null);
  const contactPhone = useRef(null);
  const contactEmail = useRef(null);

  const handleReservation = (roomTypeId) => {
    setShowingSection(2);
    setSelectedRoom(availableRooms[roomTypeId]);
    updateRoomSelection(roomTypeId, selectedRoom.pathId);
  };

  const submitReservation = async (e) => {
    e.preventDefault();
    const contactDetails = {
      name: contactName.current.value,
      email: contactEmail.current.value,
      phone: contactPhone.current.value,
    };
    updateContactDetails(contactDetails);

    const guestDetails = [
      { name: guestNameOne, age: guestAgeOne },
      { name: guestNameTwo, age: guestAgeTwo },
      { name: guestNameThree, age: guestAgeThree },
      { name: guestNameFour, age: guestAgeFour },
    ].filter((guest) => guest.name && guest.age);
    updateGuestDetails(guestDetails);

    const details = {
      ...bookingDetails,
      bookingId: generateReservationCode(),
      bookingDates: {
        bookedFom: bookingDetails.checkInDate,
        bookedUntil: bookingDetails.checkOutDate,
      },
      updatePathId: selectedRoom.pathId,
      contactDetails: contactDetails,
      guestDetails: guestDetails,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        throw new Error(`Failed to reserve room: ${response.statusText}`);
      }

      const data = await response.json();
      setReservationData(data);
      resetBookingDetails();
      setShowingSection(1);
      router.push(
        `/make-reservation/confirmation?rCode=${data.bookingId}&bId=${data.reservationId}`
      );
      console.log('Reservation successful:', data);
    } catch (error) {
      setError(error.message);
      console.error('Error during reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAvailableRooms = async () => {
    setIsFetchingRooms(true);

    try {
      const res = await fetch('/api/rooms/available', { method: 'GET' });

      if (!res.ok) {
        throw new Error(`Error fetching rooms: ${res.statusText}`);
      }

      const data = await res.json();
      setAvailableRooms(data.availableRooms);
      const firstAvailableRoom = Object.values(data.availableRooms).find(
        (room) => room !== null
      );
      setSelectedRoom(firstAvailableRoom || null);
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
    } finally {
      setIsFetchingRooms(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      updateRoomPrice(selectedRoom.price);
      updateRoomSelection(selectedRoom.typeId, selectedRoom.pathId);
    }
  }, [selectedRoom]);

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  return (
    <Fragment>
      <Container>
        {showingSection === 1 && (
          <Fragment>
            <div className="my-5">
              <CustomDateRangePicker />
            </div>
            {!isFetchingRooms ? (
              <div>
                <h1>Available Rooms</h1>
                <div className="text-xl font-bold flex gap-6 my-4">
                  <StyledButton
                    btnText="Executive Suite"
                    clickHandler={() =>
                      setShowingRoom(ROOM_TYPES_IDS.EXECUTIVE)
                    }
                  />
                  <StyledButton
                    btnText="Premium Suite"
                    clickHandler={() => setShowingRoom(ROOM_TYPES_IDS.PREMIUM)}
                  />
                  <StyledButton
                    btnText="Double Standard"
                    clickHandler={() => setShowingRoom(ROOM_TYPES_IDS.DOUBLE)}
                  />
                  <StyledButton
                    btnText="Standard Suite"
                    clickHandler={() => setShowingRoom(ROOM_TYPES_IDS.STANDARD)}
                  />
                </div>
                <RoomReservation
                  roomTypeId={showingRoom}
                  reservationHandler={handleReservation}
                />
              </div>
            ) : (
              <div className="text-2xl font-medium">Loading...</div>
            )}
          </Fragment>
        )}
        {showingSection !== 1 && (
          <Fragment>
            <form onSubmit={submitReservation}>
              {showingSection === 2 && (
                <div>
                  <div>Reservation form</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                    <div>
                      <label className="block font-bold">Check in</label>
                      <input
                        className="border border-black rounded-md w-full"
                        type="text"
                        value={format(
                          bookingDetails.checkInDate,
                          'dd MMM yyyy'
                        )}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block font-bold">Check Out</label>
                      <input
                        className="border border-black rounded-md w-full"
                        type="text"
                        value={format(
                          bookingDetails.checkOutDate,
                          'dd MMM yyyy'
                        )}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 mb-3">
                    <div>
                      <label className="block font-bold">Room Type</label>
                      <input
                        className="border border-black rounded-md w-full"
                        type="text"
                        value={ROOM_TYPES_NAMES[bookingDetails.roomTypeId]}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 mb-3">
                    <div>
                      <label className="block font-bold">
                        No. of Occupants
                      </label>
                      <input
                        className="border border-black rounded-md w-full"
                        type="number"
                        min={1}
                        max={4}
                        required
                        value={bookingDetails.guestCount}
                        onChange={(e) => updateGuestCount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <div>Occupant 1</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                      <div>
                        <label className="block font-bold">Full Name</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="text"
                          value={guestNameOne}
                          onChange={(e) =>
                            setGuestNameOne(e.target.value.trim())
                          }
                        />
                      </div>
                      <div>
                        <label className="block font-bold">Age</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="number"
                          value={guestAgeOne}
                          onChange={(e) => setGuestAgeOne(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>Occupant 2</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                      <div>
                        <label className="block font-bold">Full Name</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="text"
                          value={guestNameTwo}
                          onChange={(e) =>
                            setGuestNameTwo(e.target.value.trim())
                          }
                        />
                      </div>
                      <div>
                        <label className="block font-bold">Age</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="number"
                          value={guestAgeTwo}
                          onChange={(e) => setGuestAgeTwo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>Occupant 3</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                      <div>
                        <label className="block font-bold">Full Name</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="text"
                          value={guestNameThree}
                          onChange={(e) =>
                            setGuestNameThree(e.target.value.trim())
                          }
                        />
                      </div>
                      <div>
                        <label className="block font-bold">Age</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="number"
                          value={guestAgeThree}
                          onChange={(e) => setGuestAgeThree(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div>Occupant 4</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                      <div>
                        <label className="block font-bold">Full Name</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="text"
                          value={guestNameFour}
                          onChange={(e) =>
                            setGuestNameFour(e.target.value.trim())
                          }
                        />
                      </div>
                      <div>
                        <label className="block font-bold">Age</label>
                        <input
                          className="border border-black rounded-md w-full"
                          type="number"
                          value={guestAgeFour}
                          onChange={(e) => setGuestAgeFour(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <StyledButton
                    btnText="Next"
                    clickHandler={() => setShowingSection(3)}
                  />
                </div>
              )}
              {showingSection === 3 && (
                <div>
                  <div>Contact Details</div>
                  <div className="grid grid-cols-1 mb-3 gap-3">
                    <div>
                      <label className="block font-bold">Full Name</label>
                      <input
                        className="border border-black rounded-md w-full"
                        type="text"
                        ref={contactName}
                      />
                    </div>
                    <div>
                      <label className="block font-bold">Email</label>
                      <input
                        className="border border-black rounded-md w-full"
                        type="email"
                        ref={contactEmail}
                      />
                    </div>
                    <div>
                      <label className="block font-bold">Phone Number</label>
                      <input
                        className="border border-black rounded-md w-full"
                        type="text"
                        ref={contactPhone}
                      />
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <StyledButton
                      btnText="Back"
                      clickHandler={() => setShowingSection(2)}
                    />
                    <StyledButton isSubmitBtn={true} btnText="Reserve" />
                  </div>
                </div>
              )}
            </form>
          </Fragment>
        )}
      </Container>
      {isSubmitting && (
        <div className="fixed inset-0 z-20 flex justify-center items-center bg-black/50">
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

export default MakeReservation;
