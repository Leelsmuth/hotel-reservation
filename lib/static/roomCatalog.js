/**
 * Display data for the room types, in one place: names, URLs, images and the
 * nightly rate shown on listings. Rates come from ROOM_TYPES so listings
 * can't drift from what's charged (the server still prices every stay).
 * Ordered by price so guests can scan from the most affordable up.
 */
import { ROOM_TYPES } from './roomTypes';
import { MAX_ADULTS_PER_ROOM, MAX_GUESTS_PER_ROOM } from '../booking/occupancy';

const BASE = [
  {
    typeId: 'sSuite',
    slug: 'queen-room',
    imageKey: 'queen',
    name: 'Queen Room',
  },
  {
    typeId: 'dStandard',
    slug: 'king-room',
    imageKey: 'king',
    name: 'King Room',
  },
  {
    typeId: 'pSuite',
    slug: 'deluxe-room',
    imageKey: 'deluxe',
    name: 'Deluxe Room',
  },
  {
    typeId: 'eSuite',
    slug: 'presidential-suite',
    imageKey: 'presidential',
    name: 'Presidential Suite',
  },
];

export const ROOM_CATALOG = BASE.map((room) => {
  const type = ROOM_TYPES.find((t) => t.typeId === room.typeId);
  return {
    ...room,
    price: type?.price ?? 0,
    // Every room: up to 4 adults, 6 guests with children (lib/booking/occupancy)
    maxAdults: type?.maxNo ?? MAX_ADULTS_PER_ROOM,
    maxGuests: MAX_GUESTS_PER_ROOM,
    href: `/rooms/${room.slug}`,
    image: `/rooms/${room.imageKey}-main.jpg`,
    gallery: [
      `/rooms/${room.imageKey}-main.jpg`,
      `/rooms/${room.imageKey}-top.jpg`,
      `/rooms/${room.imageKey}-bottom.jpg`,
    ],
  };
});

/** "Up to 4 adults · 6 guests" */
export const capacityText = (room) =>
  `Up to ${room?.maxAdults ?? MAX_ADULTS_PER_ROOM} adults · ${
    room?.maxGuests ?? MAX_GUESTS_PER_ROOM
  } guests`;

export const getRoomByType = (typeId) =>
  ROOM_CATALOG.find((room) => room.typeId === typeId);

export const getRoomByKey = (imageKey) =>
  ROOM_CATALOG.find((room) => room.imageKey === imageKey);

export const LOWEST_NIGHTLY_RATE = Math.min(
  ...ROOM_CATALOG.map((r) => r.price)
);

/** Highlights shown on room cards */
export const CARD_AMENITIES = [
  { icon: 'bed', label: 'Bedroom' },
  { icon: 'dining', label: 'Dining area' },
  { icon: 'wifi', label: 'Free Wi‑Fi' },
  { icon: 'tv', label: 'Smart TV' },
];

/** Full in-room list shown on room pages */
export const ROOM_AMENITIES = [
  { icon: 'bed', label: '1 bedroom' },
  { icon: 'sofa', label: '1 living room' },
  { icon: 'bath', label: '1 private bathroom' },
  { icon: 'dining', label: '1 dining room' },
  { icon: 'wifi', label: 'Wi‑Fi (10 Mbps)' },
  { icon: 'snowflake', label: 'Air conditioning & heating' },
  { icon: 'fridge', label: 'Refrigerator' },
  { icon: 'tv', label: '2 flat-screen TVs' },
];

/** Hotel facilities (the photos are small, so they're shown as thumbnails) */
export const HOTEL_FACILITIES = [
  {
    image: '/amenities/gym.jpg',
    name: 'Fitness gym',
    text: 'Fully equipped, open to all guests',
  },
  {
    image: '/amenities/pool.jpg',
    name: 'Swimming pool',
    text: 'Relax with a swim after a long day',
  },
  {
    image: '/amenities/restaurant.jpg',
    name: 'Restaurant',
    text: 'Continental & intercontinental cuisine',
  },
  {
    image: '/amenities/spa.jpg',
    name: 'Spa & sauna',
    text: 'Expert therapists and massage',
  },
];
