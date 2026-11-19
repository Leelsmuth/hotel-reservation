import { describe, expect, test } from 'vitest';
import {
  sendBookingConfirmationEmail,
  sendReservationConfirmationEmail,
} from '@/lib/mailing/mailer';
import { sentEmails } from '../support/emails';

const EVIL = '<a href="https://evil.example">Claim your refund</a>';
const details = (changes = {}) => ({
  bookingId: 'AZTEST0001',
  contactDetails: { name: 'Ann', email: 'ann@example.com' },
  bookingDates: { bookedFrom: '2031-01-01', bookedUntil: '2031-01-03' },
  roomTypeId: 'sSuite',
  guestCount: 2,
  totalPrice: 271.2,
  ...changes,
});

describe('emails', () => {
  test("guests' text can't add links or markup", async () => {
    await sendBookingConfirmationEmail(
      'victim@example.com',
      details({
        contactDetails: { name: EVIL },
        bookingDates: { bookedFrom: '<img src=x>', bookedUntil: '2031-01-03' },
        totalPrice: '<b>1</b>',
      })
    );
    const [{ html }] = sentEmails;
    expect(html).not.toContain('<a href');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;a href=&quot;https://evil.example&quot;&gt;');
    expect(html).toContain('&lt;b&gt;1&lt;/b&gt;');
  });

  test("line breaks can't add headers through the subject", async () => {
    await sendReservationConfirmationEmail(
      'victim@example.com',
      details({ bookingId: 'X\r\nBcc: everyone@example.com' })
    );
    expect(sentEmails[0].subject).toBe(
      'Reservation Confirmation - X Bcc: everyone@example.com'
    );
  });

  test('lists each room of a multi-room booking', async () => {
    await sendBookingConfirmationEmail(
      'ann@example.com',
      details({
        totalPrice: 457.65,
        rooms: [
          {
            roomTypeId: 'sSuite',
            adults: 2,
            children: 1,
            pets: 0,
            totalPrice: 135.6,
          },
          {
            roomTypeId: 'dStandard',
            adults: 1,
            children: 0,
            pets: 2,
            totalPrice: 322.05,
          },
        ],
      })
    );
    const { text } = sentEmails[0];
    expect(text).toContain('Rooms: 2');
    expect(text).toContain('Room 1: Queen Room, 2 adults, 1 child, $135.6 CAD');
    expect(text).toContain('Room 2: King Room, 1 adult, 2 pets, $322.05 CAD');
    expect(text).toContain('Guests: 3 adults, 1 child');
    expect(text).toContain('Pets: 2');
  });
});
