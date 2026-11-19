'use client';

import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import Container from '@/components/layout/Container';
import format from 'date-fns/format';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import addDays from 'date-fns/addDays';
import { useBooking } from '@/context/BookingContext';
import { ROOM_CATALOG } from '@/lib/static/roomCatalog';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoomReservationCard from '@/components/cards/RoomReservationCard';
import RoomDetailsModal from '@/components/toast/RoomDetailsModal';
import { useAuth } from '@/context/AuthProvider';
import PhoneNumberInput from '@/components/forms/PhoneNumberInput';
import { Field, TextField, describedBy } from '@/components/forms/Field';
import { getPhoneNumberError } from '@/lib/helpers/validatePhoneNumber';
import { useToast } from '@/context/ToastContext';
import { handleError } from '@/lib/toast/handleError';
import { focusWithoutTabStop } from '@/lib/helpers/focus';
import {
  calculateBookingPrice,
  discountForNights,
  sumBookingPrices,
} from '@/lib/pricing/bookingPrice';
import { MAX_ROOMS_PER_BOOKING } from '@/lib/booking/reservations';
import {
  MAX_ADULTS_PER_ROOM,
  MAX_GUESTS_PER_ROOM,
  MAX_PETS_PER_ROOM,
  clampParty,
  describeParty,
  roomsNeededFor,
} from '@/lib/booking/occupancy';
import { searchFromQuery, searchToQuery } from '@/lib/booking/searchQuery';
import {
  fitSelectionToAvailability,
  partyOfRooms,
  planRooms,
  roomForRest,
  roomsLeft,
} from '@/lib/booking/roomSelection';
import {
  formatPrice,
  formatStayRange,
  pluralize,
} from '@/lib/helpers/formatters';
import BookingSteps from '@/components/booking/BookingSteps';
import PricingExplainer from '@/components/booking/PricingExplainer';
import RoomSelector from '@/components/booking/RoomSelector';
import StaySummary from '@/components/booking/StaySummary';
import {
  roomTypeDisplay,
  staySummaryProps,
} from '@/components/booking/staySummaryProps';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import LoadingState from '@/components/ui/LoadingState';

const ResultSkeleton = () => (
  <div
    aria-hidden="true"
    className="grid grid-cols-1 animate-pulse overflow-hidden rounded-2xl border border-ink-100 bg-white md:grid-cols-[2fr_3fr]"
  >
    <div className="aspect-[3/2] bg-ink-100" />
    <div className="space-y-3 p-6">
      <div className="h-6 w-1/2 rounded bg-ink-100" />
      <div className="h-4 w-1/3 rounded bg-ink-100" />
      <div className="h-4 w-2/3 rounded bg-ink-100" />
      <div className="mt-6 h-11 w-40 rounded-lg bg-ink-100" />
    </div>
  </div>
);

const ROOM_TYPE_ORDER = ROOM_CATALOG.map((room) => room.typeId);

/** "2 × Queen Room, King Room" */
const describeRooms = (rooms) => {
  const counts = new Map();
  rooms.forEach(({ typeId }) =>
    counts.set(typeId, (counts.get(typeId) || 0) + 1)
  );
  return [...counts]
    .map(([typeId, count]) => {
      const name = roomTypeDisplay(typeId).name;
      return count > 1 ? `${count} × ${name}` : name;
    })
    .join(', ');
};

const MakeReservation = () => {
  const router = useRouter();
  const { bookingDetails, discounts, updateDates, updateParty, resetSearch } =
    useBooking();
  const { user, userData } = useAuth();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  // The dates the results on screen are for (the picker may have changed since)
  const [searchedStay, setSearchedStay] = useState(null);
  const [error, setError] = useState(null);
  // Rooms in the request that failed (some may have been removed since)
  const [failedRoomCount, setFailedRoomCount] = useState(1);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [showingSection, setShowingSection] = useState(1);
  const [availableRooms, setAvailableRooms] = useState(null);
  // How many rooms of each type are free for the searched dates, and how
  // many of those take pets
  const [availableCounts, setAvailableCounts] = useState(null);
  const [petFriendlyCounts, setPetFriendlyCounts] = useState(null);
  // The rooms of this booking: [{ key, typeId, adults, children, pets }]
  const [rooms, setRooms] = useState([]);
  // Explains changes we made to `rooms` (picked for the party, or dropped
  // because they aren't free for new dates)
  const [roomsNotice, setRoomsNotice] = useState(null);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const contactName = useRef(null);
  const contactEmail = useRef(null);
  const formHeadingRef = useRef(null);

  const openModal = (status) => setIsRoomModalOpen(status);

  const goToSection = (section) => {
    setShowingSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Who the search was for: { adults, children, pets }
  const party = clampParty(bookingDetails.party);
  const availability = {
    counts: availableCounts,
    petCounts: petFriendlyCounts,
  };

  // Explains the rooms picked for the party, if there's anything to explain
  const describePlan = (plan, preferredTypeId) => {
    const preferred = roomTypeDisplay(preferredTypeId).name;
    const notes = [];
    const petRoomElsewhere = plan.find(
      (room) => room.pets > 0 && room.typeId !== preferredTypeId
    );
    if (petRoomElsewhere) {
      notes.push(
        `No pet-friendly ${preferred}s are free for your dates, so your ${
          party.pets === 1 ? 'pet is' : 'pets are'
        } in a pet-friendly ${roomTypeDisplay(petRoomElsewhere.typeId).name}.`
      );
    }
    if (
      plan.some((room) => room.pets === 0 && room.typeId !== preferredTypeId)
    ) {
      const free = availableCounts?.[preferredTypeId] ?? 0;
      notes.push(
        `Only ${pluralize(free, preferred)} ${
          free === 1 ? 'is' : 'are'
        } free for your dates, so we've picked other rooms for the rest.`
      );
    }
    if (plan.length < 2 && notes.length === 0) return null;
    return {
      title:
        plan.length > 1
          ? `We've added ${plan.length} rooms for your ${describeParty(party)}`
          : 'About your room',
      text: [
        ...notes,
        'Change the room types or who is in each room below, or add another room.',
      ].join(' '),
    };
  };

  const handleReservation = (roomTypeId) => {
    if (rooms.length > 0) {
      // Back on the results with rooms already picked: add one more, for
      // whoever doesn't have a room yet
      const room = roomForRest({
        selection: rooms,
        party,
        availability,
        typeOrder: ROOM_TYPE_ORDER,
        typeId: roomTypeId,
      });
      setRooms([...rooms, room]);
      setRoomsNotice(null);
    } else {
      // Enough rooms for the whole party, of this type where possible
      const plan = planRooms({
        party,
        preferredTypeId: roomTypeId,
        availability,
        typeOrder: ROOM_TYPE_ORDER,
      });
      setRooms(plan);
      setRoomsNotice(describePlan(plan, roomTypeId));
    }
    goToSection(2);
  };

  // Move focus to the form heading when the form opens (screen readers
  // and keyboard users start at the top of the new step)
  useEffect(() => {
    if (showingSection === 2) {
      focusWithoutTabStop(formHeadingRef.current, { preventScroll: true });
    }
  }, [showingSection]);

  // Signed-in guests: start with their phone number
  useEffect(() => {
    if (userData?.phone && !phoneNumber) setPhoneNumber(userData.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const submitReservation = async (e) => {
    e.preventDefault();
    const contactDetails = {
      name: contactName.current.value.trim(),
      email: contactEmail.current.value.trim(),
      phone: phoneNumber,
    };

    if (!contactDetails.phone) {
      setPhoneError(
        'Enter a phone number so we can reach you about your stay.'
      );
      return;
    }

    if (!contactDetails.name || !contactDetails.email) {
      handleError(showToast, 'All contact details are required');
      return;
    }

    const phoneValidationError = getPhoneNumberError(contactDetails.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    setPhoneError('');

    // The server picks the actual rooms, prices them and makes the booking ID
    const details = {
      checkInDate: bookingDetails.checkInDate,
      checkOutDate: bookingDetails.checkOutDate,
      bookingDates: {
        bookedFrom: format(bookingDetails.checkInDate, 'yyyy-MM-dd'),
        bookedUntil: format(bookingDetails.checkOutDate, 'yyyy-MM-dd'),
      },
      rooms: rooms.map(({ typeId, adults, children, pets }) => ({
        typeId,
        adults,
        children,
        pets,
      })),
      contactDetails: contactDetails,
      userId: user ? user.uid : null,
      isGuest: !user,
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
        const { error: reason } = await response.json().catch(() => ({}));
        const message = `Failed to reserve ${
          rooms.length === 1 ? 'room' : 'rooms'
        }: ${reason || response.statusText}`;
        if (response.status === 409) {
          // Someone else booked a room first: show what's still free. (Called
          // before setError, as it clears the error when it starts.)
          fetchAvailableRooms(
            bookingDetails.checkInDate,
            bookingDetails.checkOutDate
          );
        }
        setFailedRoomCount(rooms.length);
        setError(message);
        handleError(showToast, message);
        return;
      }

      const data = await response.json();

      // The server prices the stay; use its figures, not the ones shown here.
      // For several rooms, `pricing` has the totals and `pricing.rooms` each
      // room's own figures.
      const reservedDetails = {
        ...details,
        ...data.pricing,
        bookingId: data.bookingId,
      };

      await fetch('/api/send-confirmation-email/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: reservedDetails.contactDetails.email,
          bookingDetails: reservedDetails,
        }),
      });

      const roomCount = data.reservationIds?.length ?? 1;
      router.push(
        `/make-reservation/confirmation?resId=${data.reservationId}&bId=${
          data.bookingId
        }${roomCount > 1 ? `&rooms=${roomCount}` : ''}`
      );
      resetSearch();
    } catch (error) {
      setError(error.message);
      console.error('Error during reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAvailableRooms = async (
    checkInDate,
    checkOutDate,
    searchParty = party
  ) => {
    setIsFetchingRooms(true);
    setError(null);
    const bookedFrom = format(checkInDate, 'yyyy-MM-dd');
    const bookedUntil = format(checkOutDate, 'yyyy-MM-dd');

    try {
      const res = await fetch(
        `/api/rooms/available?startDate=${bookedFrom}&endDate=${bookedUntil}`,
        { method: 'GET' }
      );

      if (!res.ok) {
        setError(
          `We couldn't check availability (${res.status} ${res.statusText}). Please try again.`
        );
        return;
      }

      const data = await res.json();
      setAvailableRooms(data.availableRooms);
      setAvailableCounts(
        data.availableCounts ??
          Object.fromEntries(
            Object.entries(data.availableRooms).map(([typeId, room]) => [
              typeId,
              room ? 1 : 0,
            ])
          )
      );
      setPetFriendlyCounts(
        data.petFriendlyCounts ??
          Object.fromEntries(
            Object.keys(data.availableRooms).map((typeId) => [typeId, 0])
          )
      );
      setSearchedStay({ from: checkInDate, until: checkOutDate });
      // Keep the search in the web address: a refresh keeps it and the link
      // can be shared. (Replaced, not pushed, so Back still leaves the page.)
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${searchToQuery({
          checkIn: checkInDate,
          checkOut: checkOutDate,
          party: searchParty,
        })}`
      );
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
      setError(
        "We couldn't check availability. Check your connection and try again."
      );
    } finally {
      setIsFetchingRooms(false);
    }
  };

  // New availability (other dates, or someone booked a room): keep the
  // picked rooms that are still free
  useEffect(() => {
    if (!availableCounts || rooms.length === 0) return;
    const stillFree = fitSelectionToAvailability(rooms, availability);
    if (stillFree.length < rooms.length) {
      const dropped = rooms.length - stillFree.length;
      setRooms(stillFree);
      setRoomsNotice({
        tone: 'warning',
        title: `${pluralize(dropped, 'room')} you picked ${
          dropped === 1 ? "isn't" : "aren't"
        } free for these dates`,
        text:
          stillFree.length > 0
            ? `We've taken ${
                dropped === 1 ? 'it' : 'them'
              } out of your booking. Add another room if you need one.`
            : 'Choose a room below to start again.',
      });
      if (stillFree.length === 0) {
        // Nothing left to reserve: back to the results, where the notice
        // explains what happened
        setError(null);
        goToSection(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCounts, petFriendlyCounts]);

  // First search: the one in the web address if there is one (a refresh or
  // a shared link), otherwise the one in the booking state (e.g. from the
  // home page)
  useEffect(() => {
    const fromAddress = searchFromQuery(window.location.search);
    let checkIn = fromAddress?.checkIn ?? bookingDetails.checkInDate;
    let checkOut = fromAddress?.checkOut ?? bookingDetails.checkOutDate;
    const searchParty = fromAddress?.party ?? party;
    if (!checkIn || !checkOut) {
      checkIn = new Date();
      checkOut = addDays(checkIn, 1);
    }
    updateDates(checkIn, checkOut);
    updateParty(searchParty);
    fetchAvailableRooms(checkIn, checkOut, searchParty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Derived display data -------------------------------------------------
  const searchedNights = searchedStay
    ? differenceInCalendarDays(searchedStay.until, searchedStay.from)
    : 0;
  const searchedDiscount = discountForNights(searchedNights, discounts);
  const results = ROOM_CATALOG.map((room) => {
    const match = availableRooms?.[room.typeId];
    const roomPrice = match?.price ?? room.price;
    return {
      room: { ...room, price: roomPrice },
      available: Boolean(match),
      estimate:
        searchedNights > 0
          ? calculateBookingPrice({
              roomPrice,
              nights: searchedNights,
              discount: searchedDiscount,
            })
          : null,
    };
  })
    // Free rooms first; with pets, the ones that take pets before the others
    .sort(
      (a, b) =>
        Number(b.available) - Number(a.available) ||
        (party.pets > 0
          ? Number((petFriendlyCounts?.[b.room.typeId] ?? 0) > 0) -
            Number((petFriendlyCounts?.[a.room.typeId] ?? 0) > 0)
          : 0)
    );
  const availableCount = results.filter((r) => r.available).length;

  // Estimated price of the picked rooms, shaped like reservations (the
  // server prices them again when reserving)
  const stayNights = bookingDetails.nightsCount;
  const roomEstimates = rooms.map((room) => ({
    roomTypeId: room.typeId,
    adults: room.adults,
    children: room.children,
    pets: room.pets,
    bookingDates: {
      bookedFrom: bookingDetails.checkInDate,
      bookedUntil: bookingDetails.checkOutDate,
    },
    ...calculateBookingPrice({
      roomPrice:
        availableRooms?.[room.typeId]?.price ??
        roomTypeDisplay(room.typeId).price,
      nights: stayNights,
      discount: discountForNights(stayNights, discounts),
    }),
  }));
  const stayTotal =
    roomEstimates.length > 0 ? sumBookingPrices(roomEstimates).totalPrice : 0;
  const roomsWord = rooms.length > 1 ? `${rooms.length} rooms` : 'room';
  const canAddRooms = rooms.length < MAX_ROOMS_PER_BOOKING;
  const roomsNeeded = roomsNeededFor(party);
  const petRoomsFree = petFriendlyCounts
    ? Object.values(petFriendlyCounts).reduce((total, n) => total + n, 0)
    : null;
  const notEnoughPetRooms =
    party.pets > 0 &&
    petRoomsFree !== null &&
    petRoomsFree < Math.ceil(party.pets / MAX_PETS_PER_ROOM);

  // A party with pets that can't use this room type at all (greyed out)
  const isNotForPets = (room) =>
    rooms.length === 0 &&
    party.pets > 0 &&
    (petRoomsFree === 0 ||
      // A party that fits in one room needs it to take their pets
      (roomsNeeded === 1 && (petFriendlyCounts?.[room.typeId] ?? 0) === 0));

  // Why a room type can't be chosen (null if it can). Once rooms are
  // picked, the results add to the booking.
  const whyCantAdd = (room) => {
    if (rooms.length === 0) {
      if (!isNotForPets(room)) return null;
      return petRoomsFree === 0
        ? 'No pet-friendly rooms are free for these dates.'
        : `No pet-friendly ${room.name}s are free for these dates.`;
    }
    if (!canAddRooms) {
      return `Your booking has the most rooms you can book online (${MAX_ROOMS_PER_BOOKING}).`;
    }
    if (roomsLeft(rooms, availability, room.typeId) <= 0) {
      return `Every free ${room.name} is already in your booking.`;
    }
    return null;
  };

  return (
    <Fragment>
      <div className="border-b border-sand-200 bg-sand-50">
        <Container classes="py-8 sm:py-10">
          <BookingSteps
            current={showingSection === 1 ? 1 : 2}
            className="mb-8"
          />
          {showingSection === 1 ? (
            <>
              <p className="eyebrow mb-2">Book your stay</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Find an available room
              </h1>
              <p className="mt-2 max-w-2xl text-ink-600">
                Choose your dates and number of guests. We'll show which rooms
                are free and the total price for your stay.
              </p>
              <div className="card mt-6 p-5 sm:p-6">
                <CustomDateRangePicker
                  fetchAvailableRooms={fetchAvailableRooms}
                />
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => goToSection(1)}
                className="mb-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-ink-700 hover:text-ink-900"
              >
                <Icon name="arrow-left" className="h-4 w-4" />
                Back to rooms
              </button>
              <p className="eyebrow mb-2">Almost there</p>
              <h1
                ref={formHeadingRef}
                className="font-display text-3xl font-semibold tracking-tight text-ink-900 focus:outline-none sm:text-4xl"
              >
                Your details
              </h1>
              <p className="mt-2 max-w-2xl text-ink-600">
                Check your stay and tell us how to reach you. Reserving is free;
                you'll pay on the next step to confirm your booking.
              </p>
            </>
          )}
        </Container>
      </div>

      <Container classes="py-10 sm:py-12 lg:pb-20">
        {showingSection === 1 && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section
              aria-labelledby="results-title"
              aria-busy={isFetchingRooms}
            >
              {notEnoughPetRooms && !isFetchingRooms && (
                <Alert
                  tone="warning"
                  title={
                    petRoomsFree === 0
                      ? 'No pet-friendly rooms are free for these dates'
                      : `Only ${pluralize(petRoomsFree, 'pet-friendly room')} ${
                          petRoomsFree === 1 ? 'is' : 'are'
                        } free for these dates`
                  }
                  className="mb-6"
                >
                  {petRoomsFree === 0
                    ? 'Try other dates to bring your pet.'
                    : `That's room for up to ${pluralize(
                        petRoomsFree * MAX_PETS_PER_ROOM,
                        'pet'
                      )} (${MAX_PETS_PER_ROOM} per room). Try other dates to bring all your pets.`}{' '}
                  Service animals are welcome in every room and aren't counted
                  as pets.
                </Alert>
              )}

              {roomsNotice?.tone === 'warning' && (
                <Alert
                  tone="warning"
                  title={roomsNotice.title}
                  className="mb-6"
                >
                  {roomsNotice.text}
                </Alert>
              )}

              {rooms.length > 0 ? (
                <Alert
                  tone="gold"
                  title={`Your booking so far: ${pluralize(
                    rooms.length,
                    'room'
                  )} · ${describeParty(partyOfRooms(rooms))}`}
                  className="mb-6"
                  action={
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        iconRight="arrow-right"
                        onClick={() => goToSection(2)}
                      >
                        Continue with {pluralize(rooms.length, 'room')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRooms([]);
                          setRoomsNotice(null);
                        }}
                      >
                        Start over
                      </Button>
                    </div>
                  }
                >
                  {describeRooms(rooms)}.{' '}
                  {canAddRooms
                    ? 'Choose "Add to booking" on a room below to add it, or continue to your details.'
                    : `That's the most rooms you can book online (${MAX_ROOMS_PER_BOOKING}).`}
                </Alert>
              ) : (
                roomsNeeded > 1 && (
                  <Alert
                    tone="info"
                    title={`Your group needs at least ${roomsNeeded} rooms`}
                    className="mb-6"
                  >
                    Each room sleeps up to {MAX_ADULTS_PER_ROOM} adults and{' '}
                    {MAX_GUESTS_PER_ROOM} guests in total (children included),
                    and every room needs an adult.
                    {party.pets > 0 &&
                      ` Pets stay in pet-friendly rooms, up to ${MAX_PETS_PER_ROOM} per room.`}{' '}
                    Choose a room and we'll add enough rooms for everyone to
                    your booking. You can mix room types on the next step.
                  </Alert>
                )
              )}

              <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    id="results-title"
                    className="font-display text-2xl font-semibold text-ink-900"
                  >
                    {isFetchingRooms || !availableRooms
                      ? 'Available rooms'
                      : `${availableCount} of ${results.length} room types available`}
                  </h2>
                  {searchedStay && (
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
                      <Icon name="calendar" className="h-4 w-4 text-gold-700" />
                      <span>
                        {formatStayRange(searchedStay.from, searchedStay.until)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{pluralize(searchedNights, 'night')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{describeParty(party)}</span>
                    </p>
                  )}
                </div>
              </div>

              {error && !isFetchingRooms && (
                <Alert
                  tone="error"
                  title="Something went wrong"
                  className="mb-6"
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        fetchAvailableRooms(
                          bookingDetails.checkInDate,
                          bookingDetails.checkOutDate
                        )
                      }
                    >
                      Try again
                    </Button>
                  }
                >
                  {error}
                </Alert>
              )}

              {isFetchingRooms ? (
                <div className="space-y-6">
                  <p role="status" className="sr-only">
                    Checking availability…
                  </p>
                  <ResultSkeleton />
                  <ResultSkeleton />
                  <ResultSkeleton />
                </div>
              ) : availableRooms && availableCount === 0 ? (
                <EmptyState
                  title="No rooms available for these dates"
                  action={
                    <Button variant="secondary" href="/rooms">
                      Browse rooms
                    </Button>
                  }
                >
                  All our rooms are booked for the dates you chose. Try moving
                  your stay by a day or two, or a shorter stay.
                </EmptyState>
              ) : availableRooms ? (
                <div className="space-y-6">
                  {results.map(({ room, available, estimate }, index) => (
                    <RoomReservationCard
                      key={room.typeId}
                      priority={index === 0}
                      room={room}
                      available={available}
                      estimate={estimate}
                      reservationHandler={handleReservation}
                      showModal={openModal}
                      actionLabel={
                        rooms.length > 0 ? 'Add to booking' : 'Reserve'
                      }
                      actionUnavailable={whyCantAdd(room)}
                      petFriendlyFree={
                        party.pets > 0
                          ? (petFriendlyCounts?.[room.typeId] ?? 0)
                          : undefined
                      }
                      notForPets={isNotForPets(room)}
                    />
                  ))}
                </div>
              ) : null}
              <RoomDetailsModal
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
              />
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <PricingExplainer />
            </aside>
          </div>
        )}

        {showingSection !== 1 && rooms.length > 0 && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
            <form
              onSubmit={submitReservation}
              noValidate={false}
              className="space-y-8"
            >
              {error && (
                <Alert
                  tone="error"
                  title={`We couldn't reserve your ${
                    failedRoomCount > 1 ? 'rooms' : 'room'
                  }`}
                >
                  {error}
                </Alert>
              )}

              <fieldset className="card p-5 sm:p-6">
                <legend className="float-left w-full font-display text-xl font-semibold text-ink-900">
                  Your stay
                </legend>
                <div className="clear-both grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="form-label" id="stay-dates-label">
                      Dates
                    </p>
                    <div className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-sand-50 p-3 sm:flex-row sm:items-center sm:justify-between sm:pl-4">
                      <p
                        aria-labelledby="stay-dates-label"
                        className="flex items-start gap-2.5 text-ink-900"
                      >
                        <Icon
                          name="calendar"
                          className="mt-0.5 h-5 w-5 text-gold-700"
                        />
                        <span>
                          <span className="font-medium">
                            {formatStayRange(
                              bookingDetails.checkInDate,
                              bookingDetails.checkOutDate
                            )}
                          </span>
                          <span className="text-ink-600">
                            {' '}
                            · {pluralize(bookingDetails.nightsCount, 'night')}
                          </span>
                        </span>
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => goToSection(1)}
                      >
                        Change dates
                      </Button>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    {roomsNotice && (
                      <Alert
                        tone={roomsNotice.tone ?? 'info'}
                        title={roomsNotice.title}
                        className="mb-4"
                      >
                        {roomsNotice.text}
                      </Alert>
                    )}
                    <RoomSelector
                      rooms={rooms}
                      onChange={(updated) => {
                        setRooms(updated);
                        setRoomsNotice(null);
                      }}
                      roomTypes={ROOM_CATALOG}
                      availableRooms={availableRooms}
                      availability={availability}
                      party={party}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="card p-5 sm:p-6">
                <legend className="float-left w-full font-display text-xl font-semibold text-ink-900">
                  Contact details
                </legend>
                <p className="clear-both pt-1 text-sm text-ink-600">
                  We'll send your reservation confirmation and booking ID here.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <TextField
                    id="contact-name"
                    label="Full name"
                    className="sm:col-span-2"
                    type="text"
                    inputRef={contactName}
                    defaultValue={userData?.fullName ?? ''}
                    autoComplete="name"
                    required
                  />
                  <TextField
                    id="contact-email"
                    label="Email"
                    type="email"
                    inputRef={contactEmail}
                    defaultValue={user?.email ?? ''}
                    autoComplete="email"
                    required
                  />
                  <Field
                    id="contact-phone"
                    label="Phone number"
                    error={phoneError}
                  >
                    <PhoneNumberInput
                      id="contact-phone"
                      value={phoneNumber}
                      onChange={(value) => {
                        setPhoneNumber(value);
                        setPhoneError('');
                      }}
                      aria-invalid={phoneError ? true : undefined}
                      aria-describedby={describedBy('contact-phone', {
                        error: phoneError,
                      })}
                      className="form-input"
                    />
                  </Field>
                </div>
              </fieldset>

              <div className="space-y-3">
                <p className="flex items-baseline justify-between rounded-xl bg-sand-50 px-4 py-3 text-sm lg:hidden">
                  <span className="text-ink-700">
                    Total for{' '}
                    {rooms.length > 1 && `${pluralize(rooms.length, 'room')}, `}
                    {pluralize(bookingDetails.nightsCount, 'night')}, incl.
                    taxes
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-ink-900">
                    {formatPrice(stayTotal)}
                  </span>
                </p>
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  loadingText={`Reserving your ${
                    rooms.length > 1 ? 'rooms' : 'room'
                  }…`}
                >
                  Reserve {roomsWord} – pay on the next step
                </Button>
                <p className="flex items-start justify-center gap-2 text-center text-sm text-ink-600">
                  <Icon name="clock" className="mt-0.5 h-4 w-4 text-gold-700" />
                  Nothing is charged now. We'll hold your{' '}
                  {rooms.length > 1 ? 'rooms' : 'room'} for 1 hour.
                </p>
              </div>
            </form>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <StaySummary
                {...staySummaryProps(roomEstimates)}
                footnote="The final price is confirmed when you reserve and shown again before you pay."
              />
            </aside>
          </div>
        )}
      </Container>
      {isSubmitting && (
        <LoadingState
          overlay
          label={`Reserving your ${rooms.length > 1 ? 'rooms' : 'room'}…`}
        />
      )}
    </Fragment>
  );
};

export default MakeReservation;
