/**
 * Calls the app's API route handlers directly, as the browser would over
 * HTTP, without running a server:
 *
 *   const { status, body } = await api.post('/api/rooms/reserve', { ... });
 */
const ROUTES = {
  '/api/rooms/available': () => import('@/app/api/rooms/available/route'),
  '/api/rooms/reserve': () => import('@/app/api/rooms/reserve/route'),
  '/api/rooms/reserve/profile': () =>
    import('@/app/api/rooms/reserve/profile/route'),
  '/api/rooms/booking': () => import('@/app/api/rooms/booking/route'),
  '/api/rooms/cancel-reservation': () =>
    import('@/app/api/rooms/cancel-reservation/route'),
  '/api/stripe/payment-intent': () =>
    import('@/app/api/stripe/payment-intent/route'),
  '/api/stripe/webhook': () => import('@/app/api/stripe/webhook/route'),
  '/api/cron/release-holds': () => import('@/app/api/cron/release-holds/route'),
  '/api/mock/stripe/confirm': () =>
    import('@/app/api/mock/stripe/confirm/route'),
  '/api/mock/holds/expire': () => import('@/app/api/mock/holds/expire/route'),
  '/api/mock/reset': () => import('@/app/api/mock/reset/route'),
  '/api/send-confirmation-email/reservation': () =>
    import('@/app/api/send-confirmation-email/reservation/route'),
};

/**
 * @param {string} method
 * @param {string} path - e.g. "/api/rooms/booking?id=…"
 * @param {object|string} [body] - JSON body (a string is sent as it is)
 * @param {object} [headers]
 * @returns {Promise<{ status: number, body: any }>}
 */
export const request = async (method, path, body, headers = {}) => {
  const url = new URL(path, 'http://localhost:3000');
  const load = ROUTES[url.pathname];
  if (!load)
    throw new Error(`No route for ${url.pathname} in tests/support/api.js`);
  const handler = (await load())[method];
  if (!handler) throw new Error(`${url.pathname} has no ${method} handler`);

  const response = await handler(
    new Request(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body:
        body === undefined
          ? undefined
          : typeof body === 'string'
            ? body
            : JSON.stringify(body),
    })
  );
  return {
    status: response.status,
    body: await response.json().catch(() => null),
  };
};

export const api = {
  get: (path, headers) => request('GET', path, undefined, headers),
  post: (path, body, headers) => request('POST', path, body, headers),
  patch: (path, body, headers) => request('PATCH', path, body, headers),
};
