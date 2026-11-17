/**
 * Server-side in-memory "database" used in mock mode.
 *
 * The store lives on globalThis so that every API route (which Next.js may
 * bundle separately) and every hot reload share the same data. It is seeded
 * from lib/mock/fixtures.js on first use and resets whenever the dev server
 * restarts.
 */
import {
  buildMockReservations,
  buildMockRooms,
  buildMockUsers,
  MOCK_DISCOUNTS,
} from './fixtures';

const STORE_KEY = Symbol.for('hotel-reservation.mock-store');

const createSeededStore = () => {
  const now = new Date();
  const reservations = buildMockReservations(now);
  const rooms = buildMockRooms(reservations);
  const users = buildMockUsers(now);

  return {
    users: new Map(users.map((user) => [user.uid, user])),
    rooms: new Map(rooms.map((room) => [room.pathId, room])),
    reservations: new Map(reservations.map((res) => [res.id, res])),
    discounts: { ...MOCK_DISCOUNTS },
    // One-time codes for the email verification / password reset links
    actionCodes: new Map(),
    // Mock Stripe PaymentIntents (lib/mock/mockStripe.js)
    paymentIntents: new Map(),
    seededAt: now.toISOString(),
  };
};

export const getMockStore = () => {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = createSeededStore();
  }
  return globalThis[STORE_KEY];
};

export const resetMockStore = () => {
  globalThis[STORE_KEY] = createSeededStore();
  return globalThis[STORE_KEY];
};

let idCounter = 0;
export const generateMockId = (prefix) => {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${idCounter}${random}`;
};

/** Simulated network latency so loading states are visible during development. */
export const mockLatency = () => {
  const ms = Number(process.env.MOCK_LATENCY_MS ?? 300);
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : null;
};

// Callers get copies so they can't mutate the store by accident (Firestore
// also hands out snapshots, not live references).
export const clone = (value) =>
  value === null || value === undefined ? value : structuredClone(value);
