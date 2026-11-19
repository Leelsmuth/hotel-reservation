import { describe, expect, test, vi } from 'vitest';

// Lets a test decide the "random" characters
const nextIndexes = vi.hoisted(() => []);
vi.mock('node:crypto', async (importOriginal) => {
  const crypto = await importOriginal();
  return {
    ...crypto,
    randomInt: (max) =>
      nextIndexes.length > 0 ? nextIndexes.shift() : crypto.randomInt(max),
  };
});

const { newBookingId, randomBookingId } =
  await import('@/lib/booking/bookingIds');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const willDraw = (code) =>
  nextIndexes.push(...[...code].map((c) => ALPHABET.indexOf(c)));

describe('booking IDs', () => {
  test('"AZ" and 8 letters or digits', () => {
    expect(randomBookingId()).toMatch(/^AZ[A-Z0-9]{8}$/);
  });

  test('an ID already in use is never handed out', async () => {
    willDraw('JANERES1'); // AZJANERES1 is a demo reservation
    willDraw('NEWCODE1');
    expect(await newBookingId()).toBe('AZNEWCODE1');
  });
});
