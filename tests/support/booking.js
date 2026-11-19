/**
 * Booking steps for API tests, through the real route handlers.
 */
import { addDays, format, parseISO } from 'date-fns';
import { api } from './api';

/** "yyyy-MM-dd", `days` from today. */
export const day = (days) => format(addDays(new Date(), days), 'yyyy-MM-dd');

/** "yyyy-MM-dd", `nights` after the date `from`. */
export const after = (from, nights) =>
  format(addDays(parseISO(from), nights), 'yyyy-MM-dd');

export const CONTACT = {
  name: 'Test Guest',
  email: 'test.guest@example.com',
  phone: '+14165550123',
};

/**
 * POST /api/rooms/reserve. `rooms`: [{ typeId, adults, children?, pets? }].
 * Defaults: 2 nights starting 400 days from now (clear of the demo data).
 */
export const reserve = (
  rooms,
  { from = day(400), nights = 2, contact = CONTACT, userId } = {}
) =>
  api.post('/api/rooms/reserve', {
    bookingDates: { bookedFrom: from, bookedUntil: after(from, nights) },
    contactDetails: contact,
    rooms,
    ...(userId ? { userId } : {}),
  });

/** GET /api/rooms/available -> { availableRooms, availableCounts, petFriendlyCounts } */
export const availability = async (from = day(400), nights = 2) =>
  (
    await api.get(
      `/api/rooms/available?startDate=${from}&endDate=${after(from, nights)}`
    )
  ).body;

/** GET /api/rooms/booking -> the reservation plus `groupReservations` */
export const getBooking = async (reservationId) =>
  (await api.get(`/api/rooms/booking?id=${reservationId}`)).body;

export const startPayment = (reservationId) =>
  api.post('/api/stripe/payment-intent', { reservationId });

/** Pays with a (mock) card; returns the PaymentIntent (undefined if declined). */
export const payWithCard = async (
  clientSecret,
  cardNumber = '4242424242424242'
) =>
  (await api.post('/api/mock/stripe/confirm', { clientSecret, cardNumber }))
    .body.paymentIntent;

/** Starts a payment for the reservation's booking and pays it. */
export const pay = async (reservationId) => {
  const { body } = await startPayment(reservationId);
  return payWithCard(body.clientSecret);
};

/** PATCH /api/rooms/booking: the browser reporting the payment. */
export const complete = (reservationId, bookingId, paymentIntentId, userId) =>
  api.patch('/api/rooms/booking', {
    reservationId,
    bookingId,
    paymentIntentId,
    ...(userId !== undefined ? { userId } : {}),
  });

/** POST /api/stripe/webhook: Stripe reporting a payment. */
export const webhook = (paymentIntentId, type = 'payment_intent.succeeded') =>
  api.post('/api/stripe/webhook', {
    id: `evt_test_${paymentIntentId}`,
    type,
    data: { object: { id: paymentIntentId } },
  });

/** The payment intent ID in a client secret ("pi_…_secret_…"). */
export const intentIdOf = (clientSecret) => clientSecret.split('_secret_')[0];
