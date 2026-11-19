import { describe, expect, test } from 'vitest';
import { api } from '../support/api';
import { emailsAbout } from '../support/emails';
import {
  complete,
  getBooking,
  intentIdOf,
  pay,
  payWithCard,
  reserve,
  startPayment,
  webhook,
} from '../support/booking';

const reserveTwoRooms = async () =>
  (
    await reserve([
      { typeId: 'dStandard', adults: 2 },
      { typeId: 'sSuite', adults: 1, pets: 1 },
    ])
  ).body;

describe('Stripe webhook', () => {
  test('books the rooms when the browser never reports the payment (tab closed)', async () => {
    const booking = await reserveTwoRooms();
    const intent = await pay(booking.reservationId);

    const { status, body } = await webhook(intent.id);
    expect(status).toBe(200);
    expect(body.outcome).toBe('booked');
    const { groupReservations } = await getBooking(booking.reservationId);
    expect(groupReservations.every((r) => r.bookingStatus === 'booked')).toBe(
      true
    );
    expect(groupReservations[0].isGuest).toBe(true);
    expect(
      emailsAbout(`Booking Confirmation - ${booking.bookingId}`)
    ).toHaveLength(1);
  });

  test('webhook and browser both report it: booked once, one email', async () => {
    const booking = await reserveTwoRooms();
    const intent = await pay(booking.reservationId);

    expect((await webhook(intent.id)).body.outcome).toBe('booked');
    expect(
      (await complete(booking.reservationId, booking.bookingId, intent.id))
        .status
    ).toBe(200);
    expect((await webhook(intent.id)).body.outcome).toBe('already-booked');
    expect(
      emailsAbout(`Booking Confirmation - ${booking.bookingId}`)
    ).toHaveLength(1);
  });

  test('a guest who signed in to pay gets the booking on their account, even if the webhook came first', async () => {
    const booking = await reserveTwoRooms();
    const intent = await pay(booking.reservationId);
    await webhook(intent.id);

    await complete(
      booking.reservationId,
      booking.bookingId,
      intent.id,
      'mock-user-new'
    );
    const { groupReservations } = await getBooking(booking.reservationId);
    for (const room of groupReservations) {
      expect(room).toMatchObject({ userId: 'mock-user-new', isGuest: false });
    }
  });

  test('a "succeeded" event for a payment that was never made books nothing', async () => {
    const booking = await reserveTwoRooms();
    const unpaid = await startPayment(booking.reservationId);

    const { status, body } = await webhook(
      intentIdOf(unpaid.body.clientSecret)
    );
    expect(status).toBe(200); // handled, not retried
    expect(body.error).toMatch(/could not be verified/);
    expect((await getBooking(booking.reservationId)).bookingStatus).toBe(
      'reserved'
    );
  });

  test('unknown payments and other events are acknowledged, not retried', async () => {
    const unknown = await webhook('pi_does_not_exist');
    expect(unknown.status).toBe(200);
    expect(unknown.body.error).toMatch(/Unknown payment/);

    const other = await webhook('pi_x', 'charge.refunded');
    expect(other.body).toMatchObject({ received: true, ignored: true });

    expect((await api.post('/api/stripe/webhook', 'not json')).status).toBe(
      400
    );
  });
});

describe('payments that are refunded', () => {
  test('paying twice (two tabs): the second payment is refunded, once', async () => {
    const booking = await reserveTwoRooms();
    const first = await startPayment(booking.reservationId);
    const second = await startPayment(booking.reservationId);
    const firstIntent = await payWithCard(first.body.clientSecret);
    const secondIntent = await payWithCard(second.body.clientSecret);

    expect(
      (await complete(booking.reservationId, booking.bookingId, firstIntent.id))
        .status
    ).toBe(200);
    const refused = await complete(
      booking.reservationId,
      booking.bookingId,
      secondIntent.id
    );
    expect(refused.status).toBe(409);
    expect(refused.body.code).toBe('refunded');
    expect(refused.body.error).toMatch(
      /changed before your payment went through/
    );

    // Stripe reports both; nothing changes
    await webhook(firstIntent.id);
    expect((await webhook(secondIntent.id)).body.outcome).toBe('refunded');

    const { groupReservations } = await getBooking(booking.reservationId);
    for (const room of groupReservations) {
      expect(room.bookingStatus).toBe('booked');
      expect(room.paymentDetails.paymentIntentId).toBe(firstIntent.id);
      expect(room.refunds).toEqual([
        expect.objectContaining({
          paymentIntentId: secondIntent.id,
          amount: secondIntent.amount,
          reason: 'changed',
        }),
      ]);
    }
    expect(emailsAbout(`Payment Refunded - ${booking.bookingId}`)).toHaveLength(
      1
    );
    expect(
      emailsAbout(`Booking Confirmation - ${booking.bookingId}`)
    ).toHaveLength(1);
  });
});

describe('a declined card', () => {
  test('leaves the reservation awaiting payment', async () => {
    const booking = await reserveTwoRooms();
    const payment = await startPayment(booking.reservationId);
    const declined = await api.post('/api/mock/stripe/confirm', {
      clientSecret: payment.body.clientSecret,
      cardNumber: '4000000000000002',
    });
    expect(declined.status).toBe(402);
    expect(declined.body.error.message).toBe('Your card was declined.');
    expect((await getBooking(booking.reservationId)).bookingStatus).toBe(
      'reserved'
    );
  });
});
