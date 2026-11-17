/**
 * Dummy data for mock mode (see lib/config/mockMode.js).
 *
 * Everything here mirrors the shape of the real Firestore documents:
 *   users/{uid}              -> MOCK_USERS[].profile
 *   rooms/{pathId}           -> buildMockRooms()
 *   reservations/{id}        -> buildMockReservations()
 *   discounts/daysDiscount   -> MOCK_DISCOUNTS
 *
 * Dates are generated relative to "today" so the data always contains
 * upcoming, in-progress and past stays, whenever the app is started.
 *
 * Demo accounts (all use the password "Password123"):
 *   jane@example.com        verified, lots of reservations/bookings in every state
 *   john@example.com        verified, a couple of reservations/bookings
 *   new@example.com         verified, no reservations (empty states)
 *   unverified@example.com  email NOT verified (exercises the verification flow)
 *   admin@example.com       verified, isAdmin: true
 *
 * Guest (no account) lookups on /manage-reservation:
 *   AZGUESTRS1 / gary.guest@example.com   reservation awaiting payment
 *   AZGUESTBK1 / gary.guest@example.com   paid booking
 *
 * Availability scenario:
 *   Every Presidential Suite is booked or under maintenance from
 *   today+14 to today+17, so searching those dates shows it as sold out.
 */
import { addDays, format } from 'date-fns';
import { DISCOUNT, RESERVATION_STATUS, ROOM_STATUS } from '../static/roomLegend';
import { ROOMS, ROOM_TYPES } from '../static/roomTypes';
import { calculateBookingPrice, discountForNights } from '../pricing/bookingPrice';

export const MOCK_PASSWORD = 'Password123';

export const MOCK_DISCOUNTS = { ...DISCOUNT };

export const MOCK_USERS = [
  {
    uid: 'mock-user-jane',
    email: 'jane@example.com',
    password: MOCK_PASSWORD,
    emailVerified: true,
    profile: { fullName: 'Jane Doe', isAdmin: false },
  },
  {
    uid: 'mock-user-john',
    email: 'john@example.com',
    password: MOCK_PASSWORD,
    emailVerified: true,
    profile: { fullName: 'John Smith', isAdmin: false },
  },
  {
    uid: 'mock-user-new',
    email: 'new@example.com',
    password: MOCK_PASSWORD,
    emailVerified: true,
    profile: { fullName: 'Nora Newcomer', isAdmin: false },
  },
  {
    uid: 'mock-user-unverified',
    email: 'unverified@example.com',
    password: MOCK_PASSWORD,
    emailVerified: false,
    profile: { fullName: 'Uma Unverified', isAdmin: false },
  },
  {
    uid: 'mock-user-admin',
    email: 'admin@example.com',
    password: MOCK_PASSWORD,
    emailVerified: true,
    profile: { fullName: 'Hotel Admin', isAdmin: true },
  },
];

// Advertised nightly price per room type (matches the prices shown on the
// room cards throughout the UI).
const PRICE_BY_TYPE = Object.fromEntries(
  ROOM_TYPES.map((type) => [type.typeId, type.price])
);

const roomPathId = (roomNo) => `mock-room-${roomNo}`;

const ROOMS_UNDER_MAINTENANCE = [5500];

const dateOffset = (today, days) => format(addDays(today, days), 'yyyy-MM-dd');

// Same pricing as the app and the API
const priceBreakdown = (roomPrice, nights) =>
  calculateBookingPrice({
    roomPrice,
    nights,
    discount: discountForNights(nights, MOCK_DISCOUNTS),
  });

const PAID_STATUSES = [
  RESERVATION_STATUS.BOOKED,
  RESERVATION_STATUS.CHECKEDIN,
  RESERVATION_STATUS.CHECKEDOUT,
];

const ADMIN_UID = 'mock-user-admin';

/**
 * Seed reservations. `startOffset` is days from today, `roomNo` refers to the
 * room numbers in lib/static/roomTypes.js (ROOMS).
 */
const RESERVATION_SEEDS = [
  // Jane: one of everything
  {
    id: 'mock-res-jane-reserved-1',
    bookingId: 'AZJANERES1',
    userUid: 'mock-user-jane',
    roomNo: 4100,
    startOffset: 3,
    nights: 2,
    guests: [{ name: 'Jane Doe', age: '34' }, { name: 'Sam Doe', age: '36' }],
    status: RESERVATION_STATUS.RESERVED,
  },
  {
    id: 'mock-res-jane-reserved-2',
    bookingId: 'AZJANERES2',
    userUid: 'mock-user-jane',
    roomNo: 1100,
    startOffset: 20,
    nights: 12,
    guests: [{ name: 'Jane Doe', age: '34' }],
    status: RESERVATION_STATUS.RESERVED,
  },
  {
    id: 'mock-res-jane-booked-1',
    bookingId: 'AZJANEBKD1',
    userUid: 'mock-user-jane',
    roomNo: 5100,
    startOffset: 7,
    nights: 3,
    guests: [
      { name: 'Jane Doe', age: '34' },
      { name: 'Sam Doe', age: '36' },
      { name: 'Lily Doe', age: '8' },
      { name: 'Max Doe', age: '5' },
    ],
    status: RESERVATION_STATUS.BOOKED,
  },
  {
    id: 'mock-res-jane-booked-2',
    bookingId: 'AZJANEBKD2',
    userUid: 'mock-user-jane',
    roomNo: 3100,
    startOffset: 40,
    nights: 22,
    guests: [{ name: 'Jane Doe', age: '34' }, { name: 'Sam Doe', age: '36' }],
    status: RESERVATION_STATUS.BOOKED,
  },
  {
    id: 'mock-res-jane-cancelled-1',
    bookingId: 'AZJANECAN1',
    userUid: 'mock-user-jane',
    roomNo: 3200,
    startOffset: 12,
    nights: 4,
    guests: [{ name: 'Jane Doe', age: '34' }],
    status: RESERVATION_STATUS.CANCELLED,
  },
  {
    id: 'mock-res-jane-checkedin-1',
    bookingId: 'AZJANECIN1',
    userUid: 'mock-user-jane',
    roomNo: 1200,
    startOffset: -1,
    nights: 3,
    guests: [{ name: 'Jane Doe', age: '34' }],
    status: RESERVATION_STATUS.CHECKEDIN,
  },
  {
    id: 'mock-res-jane-checkedout-1',
    bookingId: 'AZJANEOUT1',
    userUid: 'mock-user-jane',
    roomNo: 4200,
    startOffset: -10,
    nights: 3,
    guests: [{ name: 'Jane Doe', age: '34' }],
    status: RESERVATION_STATUS.CHECKEDOUT,
  },

  // John
  {
    id: 'mock-res-john-reserved-1',
    bookingId: 'AZJOHNRES1',
    userUid: 'mock-user-john',
    roomNo: 1300,
    startOffset: 1,
    nights: 1,
    guests: [{ name: 'John Smith', age: '45' }],
    status: RESERVATION_STATUS.RESERVED,
  },
  {
    id: 'mock-res-john-booked-1',
    bookingId: 'AZJOHNBKD1',
    userUid: 'mock-user-john',
    roomNo: 4300,
    startOffset: 5,
    nights: 35,
    guests: [{ name: 'John Smith', age: '45' }],
    status: RESERVATION_STATUS.BOOKED,
  },

  // Guest checkouts (no account): look these up on /manage-reservation
  {
    id: 'mock-res-guest-reserved-1',
    bookingId: 'AZGUESTRS1',
    guestContact: {
      name: 'Gary Guest',
      email: 'gary.guest@example.com',
      phone: '+14165550101',
    },
    roomNo: 3300,
    startOffset: 2,
    nights: 2,
    guests: [{ name: 'Gary Guest', age: '29' }],
    status: RESERVATION_STATUS.RESERVED,
  },
  {
    id: 'mock-res-guest-booked-1',
    bookingId: 'AZGUESTBK1',
    guestContact: {
      name: 'Gary Guest',
      email: 'gary.guest@example.com',
      phone: '+14165550101',
    },
    roomNo: 2100,
    startOffset: 6,
    nights: 3,
    guests: [{ name: 'Gary Guest', age: '29' }, { name: 'Gina Guest', age: '31' }],
    status: RESERVATION_STATUS.BOOKED,
  },

  // Presidential Suites sold out from today+14 to today+17
  ...[
    [5100, 'AZBLOCK001', 'Olivia Park', 'olivia.park@example.com'],
    [5200, 'AZBLOCK002', 'Marcus Lee', 'marcus.lee@example.com'],
    [5300, 'AZBLOCK003', 'Priya Patel', 'priya.patel@example.com'],
    [5400, 'AZBLOCK004', 'Diego Alvarez', 'diego.alvarez@example.com'],
  ].map(([roomNo, bookingId, name, email], index) => ({
    id: `mock-res-presidential-block-${index + 1}`,
    bookingId,
    guestContact: { name, email, phone: `+1416555020${index}` },
    roomNo,
    startOffset: 14,
    nights: 3,
    guests: [{ name, age: '40' }],
    status: RESERVATION_STATUS.BOOKED,
  })),
];

const findRoom = (roomNo) => {
  const room = ROOMS.find((r) => r.id === roomNo);
  if (!room) throw new Error(`Mock fixture references unknown room ${roomNo}`);
  return room;
};

/**
 * Builds reservation documents shaped exactly like the ones created by
 * /make-reservation (+ /booking once paid).
 */
export const buildMockReservations = (today = new Date()) => {
  const usersByUid = Object.fromEntries(MOCK_USERS.map((u) => [u.uid, u]));

  return RESERVATION_SEEDS.map((seed) => {
    const room = findRoom(seed.roomNo);
    const roomPrice = PRICE_BY_TYPE[room.typeId];
    const checkInDate = addDays(today, seed.startOffset);
    const checkOutDate = addDays(today, seed.startOffset + seed.nights);
    const pricing = priceBreakdown(roomPrice, seed.nights);
    const user = seed.userUid ? usersByUid[seed.userUid] : null;

    const contactDetails = user
      ? { name: user.profile.fullName, email: user.email, phone: '+14165550100' }
      : seed.guestContact;

    const isPaid = PAID_STATUSES.includes(seed.status);

    return {
      id: seed.id,
      bookingId: seed.bookingId,
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      nightsCount: seed.nights,
      discount: pricing.discount,
      discountAmount: pricing.discountAmount,
      roomTypeId: room.typeId,
      roomId: roomPathId(room.id),
      roomNo: room.id,
      guestCount: Math.min(seed.guests.length, 4),
      guestCountActual: seed.guests.length,
      guestDetails: seed.guests,
      roomPrice,
      tax: pricing.tax,
      subtotal: pricing.subtotal,
      totalPrice: pricing.totalPrice,
      paymentDetails: isPaid
        ? {
            paymentStatus: 'COMPLETED',
            paymentIntentId: `pi_mock_seed_${seed.bookingId.toLowerCase()}`,
            paymentAmount: Math.round(pricing.totalPrice * 100),
          }
        : null,
      isGuest: !user,
      bookingStatus: seed.status,
      userId: user ? user.uid : null,
      checkedInBy:
        seed.status === RESERVATION_STATUS.CHECKEDIN ||
        seed.status === RESERVATION_STATUS.CHECKEDOUT
          ? ADMIN_UID
          : null,
      checkedOutBy:
        seed.status === RESERVATION_STATUS.CHECKEDOUT ? ADMIN_UID : null,
      contactDetails,
      bookingDates: {
        bookedFrom: dateOffset(today, seed.startOffset),
        bookedUntil: dateOffset(today, seed.startOffset + seed.nights),
      },
    };
  });
};

/**
 * Builds room documents from lib/static/roomTypes.js (ROOMS). A room's
 * `bookings` array holds the dates of every non-cancelled reservation for it,
 * and its status follows the same rules the API routes apply.
 */
export const buildMockRooms = (reservations) =>
  ROOMS.map((room) => {
    const pathId = roomPathId(room.id);
    const bookings = reservations
      .filter(
        (res) =>
          res.roomId === pathId &&
          res.bookingStatus !== RESERVATION_STATUS.CANCELLED
      )
      .map((res) => ({ ...res.bookingDates }));

    let status = bookings.length > 0 ? ROOM_STATUS.BOOKED : ROOM_STATUS.AVAILABLE;
    if (ROOMS_UNDER_MAINTENANCE.includes(room.id)) {
      status = ROOM_STATUS.MAINTENANCE;
    }

    return {
      pathId,
      id: room.id,
      typeId: room.typeId,
      price: PRICE_BY_TYPE[room.typeId],
      status,
      bookedFrom: null,
      bookedUntil: null,
      bookings,
    };
  });

export const buildMockUsers = (now = new Date()) =>
  MOCK_USERS.map((user) => ({
    uid: user.uid,
    email: user.email,
    password: user.password,
    emailVerified: user.emailVerified,
    profile: {
      fullName: user.profile.fullName,
      email: user.email,
      createdAt: now.toISOString(),
      isAdmin: user.profile.isAdmin,
    },
  }));
