/**
 * Before the browser tests: load every page and API route once. With the
 * dev server (E2E_DEV=1) this compiles them up front (the first visit to
 * each takes seconds) instead of during a test; with the production server
 * it's quick and harmless.
 */
const PAGES = [
  '/',
  '/make-reservation',
  '/make-reservation/confirmation',
  '/booking',
  '/booking/confirmation',
  '/manage-reservation',
  '/login',
  '/profile',
  '/profile/reservations',
  '/profile/bookings',
  '/rooms',
  '/rooms/king-room',
];
const API = [
  ['GET', '/api/rooms/available?startDate=2030-01-01&endDate=2030-01-02'],
  ['GET', '/api/rooms/reserve?bookingId=x&email=y'],
  ['POST', '/api/rooms/reserve'],
  ['GET', '/api/rooms/booking?id=x'],
  ['PATCH', '/api/rooms/booking'],
  ['PATCH', '/api/rooms/cancel-reservation'],
  ['GET', '/api/rooms/reserve/profile?userId=x&bookingStatus=reserved'],
  ['POST', '/api/stripe/payment-intent'],
  ['POST', '/api/stripe/webhook'],
  ['POST', '/api/mock/stripe/confirm'],
  ['POST', '/api/mock/holds/expire'],
  ['POST', '/api/mock/auth'],
  ['POST', '/api/mock/reset'],
  ['GET', '/api/cron/release-holds'],
];

export default async function warmUp(config) {
  const { baseURL } = config.projects[0].use;
  for (const path of PAGES) await fetch(baseURL + path);
  for (const [method, path] of API) {
    await fetch(baseURL + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : '{}',
    }).catch(() => {});
  }
}
