'use client';

import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import Container from '@/components/layout/Container';
import format from 'date-fns/format';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
import { useBooking } from '@/context/BookingContext';
import generateReservationCode from '@/lib/helpers/generateReservationCode';
import { ROOM_TYPES_NAMES } from '@/lib/static/roomLegend';
import { ROOM_CATALOG, getRoomByType } from '@/lib/static/roomCatalog';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoomReservationCard from '@/components/cards/RoomReservationCard';
import RoomDetailsModal from '@/components/toast/RoomDetailsModal';
import OptionGenerator from '@/components/forms/OptionGenerator ';
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
} from '@/lib/pricing/bookingPrice';
import {
  formatPrice,
  formatStayRange,
  pluralize,
} from '@/lib/helpers/formatters';
import BookingSteps from '@/components/booking/BookingSteps';
import PricingExplainer from '@/components/booking/PricingExplainer';
import StaySummary from '@/components/booking/StaySummary';
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

const MakeReservation = () => {
  const router = useRouter();
  const {
    bookingDetails,
    discounts,
    updateRoomSelection,
    updateGuestCount,
    updateRoomPrice,
    updateContactDetails,
    updateGuestDetails,
    updateBooking,
    updateIsGuest,
    updateUserId,
    resetBookingDetails,
  } = useBooking();
  const { user, userData } = useAuth();
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showingDates, setShowingDates] = useState('');
  // The dates the results on screen are for (the picker may have changed since)
  const [searchedStay, setSearchedStay] = useState(null);
  const [reservationData, setReservationData] = useState(null);
  const [error, setError] = useState(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [showingSection, setShowingSection] = useState(1);
  const [availableRooms, setAvailableRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);
  // Occupant details aren't collected yet; kept so the request shape is unchanged
  const [guestNameOne] = useState('');
  const [guestAgeOne] = useState('');
  const [guestNameTwo] = useState('');
  const [guestAgeTwo] = useState('');
  const [guestNameThree] = useState('');
  const [guestAgeThree] = useState('');
  const [guestNameFour] = useState('');
  const [guestAgeFour] = useState('');

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

  const handleReservation = (roomTypeId) => {
    goToSection(2);
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
        const { error: reason } = await response.json().catch(() => ({}));
        const message = `Failed to reserve room: ${reason || response.statusText}`;
        setError(message);
        handleError(showToast, message);
        return;
      }

      const data = await response.json();
      setReservationData(data);

      // The server prices the stay; use its figures, not the ones shown here
      const reservedDetails = { ...details, ...data.pricing };

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

      router.push(
        `/make-reservation/confirmation?resId=${data.reservationId}&bId=${data.bookingId}`
      );
      updateBooking(reservedDetails);
      resetBookingDetails();
    } catch (error) {
      setError(error.message);
      console.error('Error during reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAvailableRooms = async (checkInDate, checkOutDate) => {
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
      setShowingDates(`${bookedFrom} to ${bookedUntil}`);
      setSearchedStay({ from: checkInDate, until: checkOutDate });
      const firstAvailableRoom = Object.values(data.availableRooms).find(
        (room) => room !== null
      );
      setSelectedRoom(firstAvailableRoom || null);
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
      setError(
        "We couldn't check availability. Check your connection and try again."
      );
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
  }).sort((a, b) => Number(b.available) - Number(a.available));
  const availableCount = results.filter((r) => r.available).length;
  const selectedCatalogRoom = selectedRoom
    ? getRoomByType(selectedRoom.typeId)
    : null;

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
              {bookingDetails.guestCountActual > 4 && (
                <Alert
                  tone="warning"
                  title={`Rooms sleep up to 4 guests`}
                  className="mb-6"
                >
                  You searched for {bookingDetails.guestCountActual} guests, so
                  you'll need more than one room. Reserve each room separately.
                </Alert>
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
                      <span>
                        {pluralize(
                          Math.min(bookingDetails.guestCountActual || 1, 4),
                          'guest'
                        )}{' '}
                        per room
                      </span>
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

        {showingSection !== 1 && selectedRoom && (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
            <form
              onSubmit={submitReservation}
              noValidate={false}
              className="space-y-8"
            >
              {error && (
                <Alert tone="error" title="We couldn't reserve your room">
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
                  <Field id="room-type" label="Room type">
                    <select
                      id="room-type"
                      className="form-select"
                      value={selectedRoom.typeId}
                      onChange={(e) => {
                        setSelectedRoom(availableRooms[e.target.value]);
                      }}
                    >
                      {ROOM_CATALOG.filter(
                        (room) => availableRooms?.[room.typeId]
                      ).map((room) => (
                        <option key={room.typeId} value={room.typeId}>
                          {ROOM_TYPES_NAMES[room.typeId]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    id="occupants"
                    label="Guests in this room"
                    hint="Up to 4 per room"
                  >
                    <select
                      id="occupants"
                      className="form-select"
                      aria-describedby="occupants-hint"
                      value={bookingDetails.guestCount}
                      onChange={(e) =>
                        updateGuestCount(
                          e.target.value,
                          bookingDetails.guestCountActual
                        )
                      }
                    >
                      <OptionGenerator numOptions={4} unit="guest" />
                    </select>
                  </Field>
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
                    Total for {pluralize(bookingDetails.nightsCount, 'night')},
                    incl. taxes
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-ink-900">
                    {formatPrice(bookingDetails.totalPrice)}
                  </span>
                </p>
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  loadingText="Reserving your room…"
                >
                  Reserve room – pay on the next step
                </Button>
                <p className="flex items-start justify-center gap-2 text-center text-sm text-ink-600">
                  <Icon name="clock" className="mt-0.5 h-4 w-4 text-gold-700" />
                  Nothing is charged now. We'll hold your room for 1 hour.
                </p>
              </div>
            </form>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <StaySummary
                room={selectedCatalogRoom}
                checkIn={bookingDetails.checkInDate}
                checkOut={bookingDetails.checkOutDate}
                nights={bookingDetails.nightsCount}
                guests={bookingDetails.guestCount}
                price={{
                  roomPrice: bookingDetails.roomPrice,
                  nights: bookingDetails.nightsCount,
                  discount: bookingDetails.discount,
                  discountAmount: bookingDetails.discountAmount,
                  tax: bookingDetails.tax,
                  total: bookingDetails.totalPrice,
                }}
                footnote="The final price is confirmed when you reserve and shown again before you pay."
              />
            </aside>
          </div>
        )}
      </Container>
      {isSubmitting && <LoadingState overlay label="Reserving your room…" />}
    </Fragment>
  );
};

export default MakeReservation;
