export const ROOM_TYPES_IDS = {
  EXECUTIVE: 'eSuite',
  PREMIUM: 'pSuite',
  DOUBLE: 'dStandard',
  STANDARD: 'sSuite',
};

export const ROOM_TYPES_NAMES = {
  eSuite: 'Presidential Suite',
  pSuite: 'Deluxe Room',
  dStandard: 'King Room',
  sSuite: 'Queen Room',
};

export const ROOM_STATUS = {
  BOOKED: 'booked',
  AVAILABLE: 'available',
  MAINTENANCE: 'maintenance',
};

export const RESERVATION_STATUS = {
  BOOKED: 'booked',
  RESERVED: 'reserved',
  CANCELLED: 'cancelled',
  CHECKEDIN: 'checkedIn',
  CHECKEDOUT: 'checkedOut',
};

/**
 * Why a reservation was cancelled (`cancellationReason`). Reservations
 * cancelled before reasons were recorded have none.
 */
export const CANCELLATION_REASON = {
  // Not paid within the hold (1 hour), so its rooms were released
  EXPIRED: 'expired',
  // Cancelled by the guest
  GUEST: 'guest',
};

export const DISCOUNT = {
  ELEVEN: 5,
  TWENTYONE: 7.5,
  THIRTYPLUS: 10,
};

export const ROOM_MAIN_PICTURES = {
  eSuite: '/rooms/presidential-main.jpg',
  pSuite: '/rooms/deluxe-main.jpg',
  dStandard: '/rooms/king-main.jpg',
  sSuite: '/rooms/queen-main.jpg',
};

export const ROOM_DETAILS = {
  popularAmenities: [
    'Bar',
    'Pet-friendly rooms',
    'Air conditioning',
    'Free WiFi',
    '24/7 front desk',
    'Gym',
    'Non-smoking',
  ],
  foodAndDrink: ['Continental breakfast', 'Bar/lounge', 'Water dispenser'],
  whatToDo: ['Golfing nearby'],
  workingAway: [
    '24-hour business center',
    '7 meeting rooms',
    'Conference space (6500 square feet)',
  ],
  services: [
    '24-hour front desk',
    'Concierge services',
    'Luggage storage',
    'Wedding services',
    'Multilingual staff',
  ],
  facilities: [
    'ATM/banking',
    'Fitness center',
    'Banquet hall',
    'Fireplace in lobby',
    'Television in common areas',
  ],
};
