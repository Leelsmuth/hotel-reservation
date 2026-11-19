/**
 * `npm run mock:expire-holds`: ends the 1-hour hold on unpaid reservations
 * now, so you can see what happens when it runs out without waiting. Needs
 * the mock dev server running (`npm run dev:mock`).
 *
 *   npm run mock:expire-holds                    every unpaid reservation
 *   npm run mock:expire-holds -- AZ7K2M9Q4X      just this booking
 *   npm run mock:expire-holds -- AZ7K2M9Q4X --url http://localhost:3100
 *
 * The server's address can also be set with MOCK_URL (default
 * http://localhost:3000).
 */
const args = process.argv.slice(2);
const urlFlag = args.indexOf('--url');
const baseUrl =
  (urlFlag !== -1 && args[urlFlag + 1]) ||
  process.env.MOCK_URL ||
  'http://localhost:3000';
const bookingId = args.find(
  (arg, index) => !arg.startsWith('--') && args[index - 1] !== '--url'
);

let response;
try {
  response = await fetch(new URL('/api/mock/holds/expire', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingId ? { bookingId } : {}),
  });
} catch {
  console.error(
    `Couldn't reach the dev server at ${baseUrl}. Start it with \`npm run dev:mock\`, or pass its address with --url.`
  );
  process.exit(1);
}

const body = await response.json().catch(() => ({}));
if (response.status === 404 && !body.error) {
  console.error(
    `${baseUrl} isn't running in mock mode. Start it with \`npm run dev:mock\`.`
  );
  process.exit(1);
}
if (!response.ok) {
  console.error(
    body.error || `Failed: ${response.status} ${response.statusText}`
  );
  process.exit(1);
}

if (body.released.length === 0) {
  console.log(
    'No reservations are awaiting payment, so there was nothing to expire.'
  );
} else {
  for (const { bookingId: id, reservationIds } of body.released) {
    const rooms = reservationIds.length;
    console.log(
      `Expired ${id} (${rooms} room${rooms === 1 ? '' : 's'}): cancelled, reason "expired".`
    );
  }
  console.log(
    '\nLook it up on Manage booking (or refresh an open page) to see it cancelled.' +
      '\nThe "Reservation Expired" email is printed in the dev server terminal.'
  );
}
