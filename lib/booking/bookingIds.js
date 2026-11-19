/**
 * Booking IDs (the code guests use to find their booking, e.g. "AZ7K2M9Q4X"),
 * made on the server. Server-only: uses node:crypto.
 */
import { randomInt } from 'node:crypto';
import repository from '@/lib/data/repository';

const PREFIX = 'AZ';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const LENGTH = 8;
const MAX_ATTEMPTS = 5;

/** A random booking ID: "AZ" + 8 letters or digits. */
export const randomBookingId = () =>
  PREFIX +
  Array.from(
    { length: LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)]
  ).join('');

/**
 * A booking ID no reservation uses yet. With 36^8 (2.8 trillion) possible
 * codes a clash is very unlikely, but it's checked rather than assumed.
 */
export const newBookingId = async () => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const bookingId = randomBookingId();
    if (!(await repository.isBookingIdTaken(bookingId))) return bookingId;
  }
  throw new Error('Could not find an unused booking ID.');
};
