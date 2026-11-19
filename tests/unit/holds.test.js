import { describe, expect, test } from 'vitest';
import {
  HOLD_MINUTES,
  PAYMENT_GRACE_MINUTES,
  holdWhilePaying,
  isHoldExpired,
  newHold,
} from '@/lib/booking/holds';

const T0 = new Date('2031-01-01T10:00:00Z');
const at = (minutes) => new Date(T0.getTime() + minutes * 60 * 1000);
const iso = (minutes) => at(minutes).toISOString();
const unpaid = { bookingStatus: 'reserved', ...newHold(T0) };

describe('the 1-hour hold', () => {
  test('is 1 hour, plus up to 15 minutes once paying', () => {
    expect(HOLD_MINUTES).toBe(60);
    expect(PAYMENT_GRACE_MINUTES).toBe(15);
    expect(unpaid).toMatchObject({ createdAt: iso(0), holdExpiresAt: iso(60) });
  });

  test('expires at the end of the hour', () => {
    expect(isHoldExpired(unpaid, at(59))).toBe(false);
    expect(isHoldExpired(unpaid, at(60))).toBe(true);
  });

  test('paid reservations never expire', () => {
    expect(isHoldExpired({ ...unpaid, bookingStatus: 'booked' }, at(90))).toBe(
      false
    );
  });

  test('an unpaid reservation with no hold recorded (made before holds) has expired', () => {
    expect(isHoldExpired({ bookingStatus: 'reserved' }, at(0))).toBe(true);
  });
});

describe('extra time once the guest starts paying', () => {
  test('not needed early on', () => {
    expect(holdWhilePaying(unpaid, at(10))).toBeNull();
  });

  test('15 minutes from when they start paying', () => {
    expect(holdWhilePaying(unpaid, at(50))).toBe(iso(65));
    expect(holdWhilePaying({ ...unpaid, holdExpiresAt: iso(65) }, at(58))).toBe(
      iso(73)
    );
  });

  test('never past 1 hour 15 minutes', () => {
    expect(holdWhilePaying({ ...unpaid, holdExpiresAt: iso(73) }, at(70))).toBe(
      iso(75)
    );
    expect(
      holdWhilePaying({ ...unpaid, holdExpiresAt: iso(75) }, at(74))
    ).toBeNull();
  });

  test('not for reservations without a recorded hold', () => {
    expect(holdWhilePaying({ bookingStatus: 'reserved' }, at(1))).toBeNull();
  });
});
