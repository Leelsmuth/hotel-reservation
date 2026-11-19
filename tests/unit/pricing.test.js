import { describe, expect, test } from 'vitest';
import {
  calculateBookingPrice,
  discountForNights,
  nightsBetween,
  sumBookingPrices,
} from '@/lib/pricing/bookingPrice';

const DISCOUNTS = { ELEVEN: 5, TWENTYONE: 7.5, THIRTYPLUS: 10 };

describe('pricing', () => {
  test.each([
    [10, 0],
    [11, 5],
    [20, 5],
    [21, 7.5],
    [29, 7.5],
    [30, 10],
  ])('%i nights -> %f% discount', (nights, discount) => {
    expect(discountForNights(nights, DISCOUNTS)).toBe(discount);
  });

  test('one night in a King Room: $135 + 13% tax', () => {
    expect(calculateBookingPrice({ roomPrice: 135, nights: 1 })).toMatchObject({
      subtotal: 135,
      tax: 17.55,
      totalPrice: 152.55,
    });
  });

  test('several rooms add up to exactly the sum of their rounded totals', () => {
    const king = calculateBookingPrice({
      roomPrice: 135,
      nights: 12,
      discount: 5,
    });
    const deluxe = calculateBookingPrice({
      roomPrice: 150,
      nights: 12,
      discount: 5,
    });
    const total = sumBookingPrices([king, king, deluxe]);
    expect(total.totalPrice).toBe(
      Math.round((king.totalPrice * 2 + deluxe.totalPrice) * 100) / 100
    );
    expect(total.discountAmount).toBe(
      Math.round((king.discountAmount * 2 + deluxe.discountAmount) * 100) / 100
    );
  });

  test('nightsBetween needs yyyy-MM-dd dates', () => {
    expect(nightsBetween('2031-01-01', '2031-01-04')).toBe(3);
    expect(nightsBetween('2031-02-30', '2031-03-01')).toBeNaN();
    expect(nightsBetween('garbage', '2031-03-01')).toBeNaN();
  });
});
