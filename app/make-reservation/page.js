'use client';

import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import Container from '@/components/layout/Container';
import StyledButton from '@/components/ui/StyledButton';
import format from 'date-fns/format';
import { useBooking } from '@/context/BookingContext';
import generateReservationCode from '@/lib/helpers/generateReservationCode';
import { ROOM_TYPES_IDS, ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/anim/Spinner';
import RoomReservationCard from '@/components/cards/RoomReservationCard';
import HeadingOne from '@/components/typography/HeadingOne';
import RoomHomeCard from '@/components/cards/RoomHomeCard';
import HeadingTwo from '@/components/typography/HeadingTwo';
import RoomDetailsModal from '@/components/toast/RoomDetailsModal';
import OptionGenerator from '@/components/forms/OptionGenerator ';
import { useAuth } from '@/context/AuthProvider';

const MakeReservation = () => {
  const router = useRouter();
  const {
    bookingDetails,
    updateRoomSelection,
    updateGuestCount,
    updateRoomPrice,
    updateContactDetails,
    updateGuestDetails,
    updateBooking,
    updateIsGuest,
    updateUserId,
  } = useBooking();
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showingDates, setShowingDates] = useState('');
  const [reservationData, setReservationData] = useState(null);
  const [error, setError] = useState(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [showingRoom, setShowingRoom] = useState(ROOM_TYPES_IDS.EXECUTIVE);
  const [showingSection, setShowingSection] = useState(1);
  const [availableRooms, setAvailableRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isFetchingRooms, setIsFetchingRooms] = useState(true);
  const [guestNameOne, setGuestNameOne] = useState('');
  const [guestAgeOne, setGuestAgeOne] = useState('');
  const [guestNameTwo, setGuestNameTwo] = useState('');
  const [guestAgeTwo, setGuestAgeTwo] = useState('');
  const [guestNameThree, setGuestNameThree] = useState('');
  const [guestAgeThree, setGuestAgeThree] = useState('');
  const [guestNameFour, setGuestNameFour] = useState('');
  const [guestAgeFour, setGuestAgeFour] = useState('');

  const contactName = useRef(null);
  const contactPhone = useRef(null);
  const contactEmail = useRef(null);

  const openModal = (status) => setIsRoomModalOpen(status);

  const handleReservation = (roomTypeId) => {
    setShowingSection(2);
    setSelectedRoom(availableRooms[roomTypeId]);
    updateRoomSelection(
      roomTypeId,
      availableRooms[roomTypeId].pathId,
      availableRooms[roomTypeId].id
    );
    if (user) {
      updateIsGuest(false);
      updateUserId(user.uid);
    }
  };

  const submitReservation = async (e) => {
    e.preventDefault();
    const contactDetails = {
      name: contactName.current.value.trim(),
      email: contactEmail.current.value.trim(),
      phone: contactPhone.current.value.trim(),
    };

    if (
      !contactDetails.name ||
      !contactDetails.email ||
      !contactDetails.phone
    ) {
      alert('Contact details is required');
      return;
    }

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
        bookedFrom: format(bookingDetails.checkInDate, 'yyyy-MM-dd'),
        bookedUntil: format(bookingDetails.checkOutDate, 'yyyy-MM-dd'),
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
        setError(`Failed to reserve room: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      setReservationData(data);
      setShowingSection(1);

      await fetch('/api/send-confirmation-email/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: details.contactDetails.email,
          details,
        }),
      });

      router.push(
        `/make-reservation/confirmation?resId=${data.reservationId}&bId=${data.bookingId}`
      );
      updateBooking(details);
      // resetBookingDetails();
    } catch (error) {
      setError(error.message);
      console.error('Error during reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAvailableRooms = async (checkInDate, checkOutDate) => {
    setIsFetchingRooms(true);
    const bookedFrom = format(checkInDate, 'yyyy-MM-dd');
    const bookedUntil = format(checkOutDate, 'yyyy-MM-dd');

    try {
      const res = await fetch(
        `/api/rooms/available?startDate=${bookedFrom}&endDate=${bookedUntil}`,
        { method: 'GET' }
      );

      if (!res.ok) {
        setError(`Error fetching rooms: ${res.statusText}`);
        return;
      }

      const data = await res.json();
      setAvailableRooms(data.availableRooms);
      setShowingDates(`${bookedFrom} to ${bookedUntil}`);
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
      updateRoomSelection(
        selectedRoom.typeId,
        selectedRoom.pathId,
        selectedRoom.id
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom]);

  useEffect(() => {
    fetchAvailableRooms(
      bookingDetails.checkInDate,
      bookingDetails.checkOutDate
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Fragment>
      <Container classes="mb-20">
        {showingSection === 1 && (
          <Fragment>
            <div className="my-5">
              <CustomDateRangePicker
                fetchAvailableRooms={fetchAvailableRooms}
              />
            </div>
            {bookingDetails.guestCountActual > 4 && (
              <div className="italic text-red-500 text-base">
                The available rooms cannot accommodate{' '}
                {bookingDetails.guestCountActual} guests. Try booking more rooms
                for your trip.
              </div>
            )}
            {!isFetchingRooms ? (
              <div className="min-h-[50vw]">
                <HeadingOne>Now showing Available Rooms</HeadingOne>
                <div className="mb-6">
                  From{' '}
                  <span className="italic font-semibold text-lg">
                    {showingDates}
                  </span>
                </div>
                <div className="flex flex-col gap-6">
                  {availableRooms?.eSuite && (
                    <RoomReservationCard
                      reservationHandler={handleReservation}
                      roomTypeId={ROOM_TYPES_IDS.EXECUTIVE}
                      imageName="presidential-main"
                      roomPath="presidential-suite"
                      title="Presidential Suite"
                      price="350"
                      showModal={openModal}
                    />
                  )}
                  {availableRooms?.pSuite && (
                    <RoomReservationCard
                      reservationHandler={handleReservation}
                      roomTypeId={ROOM_TYPES_IDS.PREMIUM}
                      imageName="deluxe-main"
                      roomPath="deluxe-room"
                      title="Deluxe Room"
                      price="150"
                      showModal={openModal}
                    />
                  )}
                  {availableRooms?.dStandard && (
                    <RoomReservationCard
                      reservationHandler={handleReservation}
                      roomTypeId={ROOM_TYPES_IDS.DOUBLE}
                      imageName="king-main"
                      roomPath="king-room"
                      title="King Room"
                      price="135"
                      showModal={openModal}
                    />
                  )}
                  {availableRooms?.sSuite && (
                    <RoomReservationCard
                      reservationHandler={handleReservation}
                      roomTypeId={ROOM_TYPES_IDS.STANDARD}
                      imageName="queen-main"
                      roomPath="queen-room"
                      title="Queen Room"
                      price="120"
                      showModal={openModal}
                    />
                  )}
                </div>
                <RoomDetailsModal
                  isOpen={isRoomModalOpen}
                  onClose={() => setIsRoomModalOpen(false)}
                />
              </div>
            ) : (
              <div className="text-2xl font-medium min-h-[50vw]">
                Loading...
              </div>
            )}
            <hr className="mt-16" />
            <div className="mt-16">
              <h2 className="text-2xl font-bold mb-6 uppercase">
                Find out more about our rooms
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
          </Fragment>
        )}
        {showingSection !== 1 && (
          <Fragment>
            <form onSubmit={submitReservation} className="my-8">
              {showingSection === 2 && (
                <div>
                  <HeadingOne classes="mb-5 text-center uppercase">
                    Reservation form
                  </HeadingOne>
                  <div className="grid grid-cols-1 gap-6 max-w-96 mx-auto mb-6">
                    <div>
                      <label className="block font-bold">Booking dates</label>
                      <input
                        className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                        type="text"
                        value={`${format(
                          bookingDetails.checkInDate,
                          'dd MMM yyyy'
                        )} to ${format(
                          bookingDetails.checkOutDate,
                          'dd MMM yyyy'
                        )}`}
                        readOnly
                      />
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setShowingSection(1)}
                          className="uppercase text-primary font-bold text-base hover:underline"
                        >
                          Change date
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold">Room Type</label>
                      <select
                        className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
                        value={selectedRoom.typeId}
                        onChange={(e) => {
                          setSelectedRoom(availableRooms[e.target.value]);
                        }}
                      >
                        {availableRooms.eSuite && (
                          <option value={ROOM_TYPES_IDS.EXECUTIVE}>
                            {ROOM_TYPES_NAMES.eSuite}
                          </option>
                        )}
                        {availableRooms.pSuite && (
                          <option value={ROOM_TYPES_IDS.PREMIUM}>
                            {ROOM_TYPES_NAMES.pSuite}
                          </option>
                        )}
                        {availableRooms.dStandard && (
                          <option value={ROOM_TYPES_IDS.DOUBLE}>
                            {ROOM_TYPES_NAMES.dStandard}
                          </option>
                        )}
                        {availableRooms.sSuite && (
                          <option value={ROOM_TYPES_IDS.STANDARD}>
                            {ROOM_TYPES_NAMES.sSuite}
                          </option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold">
                        No. of Occupants
                      </label>
                      <select
                        className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
                        value={bookingDetails.guestCount}
                        onChange={(e) =>
                          updateGuestCount(e.target.value, guestCountActual)
                        }
                      >
                        <OptionGenerator numOptions={4} />
                      </select>
                    </div>
                  </div>
                  <hr />
                  <HeadingTwo classes="max-w-96 mx-auto mt-5">
                    Contact Details
                  </HeadingTwo>
                  <div className="grid grid-cols-1 gap-6 max-w-96 mx-auto mb-3">
                    <div className="grid grid-cols-1 mb-3 gap-3">
                      <div>
                        <label className="block font-bold">Full Name</label>
                        <input
                          className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                          type="text"
                          ref={contactName}
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold">Email</label>
                        <input
                          className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                          type="email"
                          ref={contactEmail}
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold">Phone Number</label>
                        <input
                          className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                          type="text"
                          ref={contactPhone}
                          required
                        />
                      </div>
                    </div>
                    <div className="*:w-full">
                      {/* <StyledButton
                        btnText="Back"
                        clickHandler={() => setShowingSection(2)}
                      /> */}
                      <StyledButton isSubmitBtn={true} btnText="Reserve" />
                    </div>
                  </div>
                  {false && (
                    <Fragment>
                      <div>
                        <div>Occupant 1</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
                          <div>
                            <label className="block font-bold">Full Name</label>
                            <input
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
                              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                              type="number"
                              value={guestAgeFour}
                              onChange={(e) => setGuestAgeFour(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  )}
                  {/* <StyledButton
                    btnText="Next"
                    clickHandler={() => setShowingSection(3)}
                  /> */}
                </div>
              )}
              {showingSection === 3 && (
                <div>
                  <div>Contact Details</div>
                  <div className="grid grid-cols-1 mb-3 gap-3">
                    <div>
                      <label className="block font-bold">Full Name</label>
                      <input
                        className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                        type="text"
                        ref={contactName}
                      />
                    </div>
                    <div>
                      <label className="block font-bold">Email</label>
                      <input
                        className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                        type="email"
                        ref={contactEmail}
                      />
                    </div>
                    <div>
                      <label className="block font-bold">Phone Number</label>
                      <input
                        className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
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
