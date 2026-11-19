This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

Running the app for real needs Firebase, Stripe and email credentials in `.env.local` (see [`.env.example`](./.env.example)). If you don't have them, or a service is down, use **mock mode**.

## Mock mode (no Firebase / Stripe / PayPal / email needed)

```bash
npm run dev:mock
```

This starts the normal dev server with `NEXT_PUBLIC_USE_MOCKS=true`. You can also put that in `.env.local` and use `npm run dev`. The whole app works end to end on dummy data: browsing, searching availability, reserving, paying, signing up and logging in, the profile pages, cancelling, and password reset.

- **No credentials, no external calls.** Firebase is never initialised, and Stripe.js and the PayPal SDK are never loaded.
- **Data lives in memory on the dev server.** Changes persist across pages and reloads, and **reset when you restart the server**.
- **Emails are printed in the terminal** running the dev server, not sent. Email verification and password reset links are printed there too, so open them from the terminal.
- **Payments are simulated** with a mock card form that works like Stripe test mode (see below).
- A **"Mock mode · dummy data"** badge at the bottom of every page shows that mock mode is on.
- API calls get about 300 ms of artificial latency so loading states are visible. Tune it with `MOCK_LATENCY_MS` (`0` turns it off).
- The first visit to each page after starting the dev server waits while Next.js compiles it (several seconds). `npm run dev:mock -- --turbopack` (works with `npm run dev` too) makes this about 3× faster.

### Demo accounts

All accounts use the password **`Password123`**.

| Email                    | What it's for                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `jane@example.com`       | Main demo user: reservations and bookings in every state (reserved, booked, cancelled, checked in/out) |
| `john@example.com`       | Second user with a short reservation and a 35-night booking (10% discount)                      |
| `new@example.com`        | Verified user with no reservations (empty states)                                               |
| `unverified@example.com` | Email not verified (shows the "please verify your email" flow)                                  |
| `admin@example.com`      | `isAdmin: true`                                                                                 |

New sign-ups work too. Like Firebase, they must verify their email first: the link is printed in the terminal.

### Reservations to look up on `/manage-reservation`

| Booking ID   | Email                    | State                                        |
| ------------ | ------------------------ | -------------------------------------------- |
| `AZGUESTRS1` | `gary.guest@example.com` | Guest reservation awaiting payment           |
| `AZGUESTBK1` | `gary.guest@example.com` | Guest booking (paid)                         |
| `AZGUESTGP1` | `gary.guest@example.com` | Guest booking of 3 rooms (paid)              |
| `AZPETFAM1`  | `paula.pet@example.com`  | 2 rooms with adults, children and pets (paid) |
| `AZJANERES1` | `jane@example.com`       | Reservation awaiting payment (2 nights)      |
| `AZJANERES2` | `jane@example.com`       | Reservation, 12 nights (5% discount)         |
| `AZJANEGRP1` | `jane@example.com`       | Reservation of 2 rooms awaiting payment      |
| `AZJANEBKD1` | `jane@example.com`       | Booking, 4 guests                            |
| `AZJANEBKD2` | `jane@example.com`       | Booking, 22 nights (7.5% discount)           |
| `AZJANECAN1` | `jane@example.com`       | Cancelled                                    |
| `AZJANECIN1` | `jane@example.com`       | Checked in (hidden by the manage page)       |
| `AZJANEOUT1` | `jane@example.com`       | Checked out (hidden by the manage page)      |
| `AZJOHNRES1` | `john@example.com`       | Reservation awaiting payment                 |
| `AZJOHNBKD1` | `john@example.com`       | Booking, 35 nights (10% discount)            |
| `AZGUESTEXP1` | `eve.expired@example.com` | Unpaid past its 1-hour hold: released (cancelled, "expired") by the first request, with an email |
| `AZOLDRES01` | `oscar.old@example.com`  | Unpaid, from before holds were recorded: released without an email |

The demo reservations awaiting payment were made 5 minutes before the server started, so their holds run out about **55 minutes after it starts**. Restart the server to get them back.

All dates are relative to the day the server starts, so there are always upcoming, current and past stays.

**Sold-out scenario:** every Presidential Suite is booked or under maintenance from **today + 14 to today + 17 days**. Search those dates on `/make-reservation` to see it disappear from the results.

**Pets scenario:** rooms 2400 and 2500 (Queen), 3400 and 3500 (King) and 4500 (Deluxe) are pet-friendly. All five are booked from **today + 30 to today + 33 days**, so a search with pets finds no pet-friendly room then.

### Mock payments

The booking page shows a mock card form instead of Stripe Elements. Like Stripe test mode, the card number decides the result. The outcome is decided on the server (`/api/mock/stripe/confirm`), so the booking step verifies mock payments exactly as it verifies real ones:

| Card number           | Result             |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Success            |
| `4000 0000 0000 0002` | Card declined      |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card       |

Like Stripe, a successful mock payment is also sent to the webhook (`/api/stripe/webhook`) a moment later, independently of the browser (`MOCK_WEBHOOK_DELAY_MS`, default 1500; negative turns it off). The mock card form also has a **"Mock: pay, then close the tab"** button: it pays without the page reporting it, so only the webhook can complete the booking.

To try hold expiry without waiting an hour, book something, then end its hold from a second terminal while the dev server runs:

```bash
npm run mock:expire-holds -- AZ7K2M9Q4X   # that booking
npm run mock:expire-holds                 # every booking awaiting payment
```

It's then handled exactly as after a real hour: cancelled with reason "expired", rooms freed, and a "Reservation Expired" email in the dev server terminal. Refresh Manage booking to see it. A payment page left open can still pay afterwards, to try late payments. (The script calls the mock-only `POST /api/mock/holds/expire`; from the browser console: `fetch('/api/mock/holds/expire', { method: 'POST', body: JSON.stringify({ bookingId: 'AZ7K2M9Q4X' }) }).then((r) => r.json())`. For another port, add `--url http://localhost:3100` or set `MOCK_URL`.)

To try the extra minutes a guest gets once they start paying, shorten the hold instead: `RESERVATION_HOLD_MINUTES=2 PAYMENT_GRACE_MINUTES=1 npm run dev:mock` (the pages still say "1 hour").

`PayPalButton` renders a mock PayPal button with "pay" and "simulate failure" actions.

### How it works / adding data

| What                                | Where                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| On/off switch                       | `lib/config/mockMode.js` (`NEXT_PUBLIC_USE_MOCKS`)                                          |
| **Dummy data (edit this)**          | `lib/mock/fixtures.js`                                                                      |
| API data access (Firestore or mock) | `lib/data/repository.js` → `firestoreRepository.js` / `mockRepository.js`                   |
| In-memory store                     | `lib/mock/store.js`                                                                         |
| Auth (Firebase Auth or mock)        | `lib/auth/authClient.js` → `firebaseAuthClient.js` / `lib/mock/mockAuthClient.js` (+ `/api/mock/auth`) |
| Pricing (UI and server)             | `lib/pricing/bookingPrice.js`                                                               |
| Payments                            | `lib/booking/payments.js`, `lib/payment-gateway/stripe.js` → `lib/mock/mockStripe.js`, `components/payment/Mock*.jsx` |
| Emails                              | `lib/mailing/mailer.js` → `lib/mock/mockMailer.js`                                          |

The API routes and pages are the same in both modes: only the layer underneath changes. So the requests in your browser's network tab, the response shapes and the status codes (including 404s and errors) match what you get against Firebase. When you add a feature that touches Firestore or Auth, add it to **both** repositories (or auth clients) so mock mode keeps working.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Testing

```bash
npm test            # logic and API tests (Vitest), a few seconds
npm run test:e2e    # browser tests (Playwright), about 4 minutes
```

Both run on mock mode's dummy data: no Firebase, Stripe or email needed.

- **`npm test`** (`tests/unit`, `tests/api`, `tests/firestore`). The API
  tests call the real route handlers directly, with no server, so they're
  fast. Every test starts from fresh dummy data, and emails are captured in
  `tests/support/emails.js` so tests can check what was sent (and how
  often). Tests that need time to pass (e.g. a 1-hour hold running out)
  move the clock with `vi.setSystemTime`. `tests/firestore` runs the
  production Firestore data code against an in-memory stand-in
  (`tests/support/fakeFirestore.js`). `npm run test:watch` reruns tests as
  you edit.
- **`npm run test:e2e`** (`tests/e2e`). Builds the app in mock mode and
  runs the production server on port 3200 (`E2E_PORT`), in `.next-e2e`, so
  it can run next to your own dev server. (A production server compiles
  nothing during the tests, which keeps them reliable; against the dev
  server they were flaky on a busy machine. `E2E_DEV=1 npm run test:e2e`
  uses the dev server anyway, skipping the build, handy while writing
  tests.) Tests run one at a time, each from fresh dummy data
  (`POST /api/mock/reset`). First time on a machine:
  `npx playwright install chromium`. On failure, a trace and screenshot are
  saved in `test-results/` (`npx playwright show-trace …`).
- **On GitHub** (`.github/workflows/tests.yml`): every pull request and
  push to `main`/`master` runs lint, `npm test` and a build in one job, and
  the browser tests in another. If browser tests fail, their report and
  traces are attached to the run as the `playwright-report` artifact.
  Nothing needs configuring: it all runs in mock mode, without secrets.

| Area | Logic / API tests | Browser tests |
| --- | --- | --- |
| Several rooms per booking | `tests/api/multiRoomBookings.test.js`, `tests/unit/roomSelection.test.js` | `tests/e2e/multiRoomBookings.spec.js` |
| Adults, children, pets | `tests/api/petsAndGuests.test.js`, `tests/unit/occupancy.test.js` | `tests/e2e/petsAndGuests.spec.js` |
| Payments, webhook, refunds | `tests/api/paymentCompletion.test.js` | `tests/e2e/holdsAndPayments.spec.js` |
| 1-hour hold | `tests/api/holds.test.js`, `tests/unit/holds.test.js` | `tests/e2e/holdsAndPayments.spec.js` |
| Search form and links | `tests/unit/searchQuery.test.js` | `tests/e2e/search.spec.js` |
| Account pages, single rooms, phones | | `tests/e2e/accountAndSingleRoom.spec.js` |
| Emails, booking IDs, prices, rules | `tests/unit/*.test.js` | |
| Firestore data code | `tests/firestore/firestoreRepository.test.js` | |

To reset the dummy data while using the app, without restarting:
`curl -X POST http://localhost:3000/api/mock/reset` (mock mode only).

## Multi-room bookings

A guest can book several rooms for the same dates in one go: for a group
bigger than a room sleeps (4 adults, 6 guests with children), or to spread a
party over more rooms. On `/make-reservation`, choosing a room adds enough
rooms for the party searched for; on the next step each room has its own room
type, adults, children and pets, and rooms can be added or removed (up to 10
per booking).

- **One reservation document per room.** The rooms of a booking share its
  `bookingId` and list each other in `groupReservationIds` (in the order they
  were booked). Reservations without `groupReservationIds` (everything made
  before this feature) are simply a booking of one room.
- **Reserve:** the browser sends the room *types* and who's in each room
  (`rooms: [{ typeId, adults, children, pets }]`); the server picks free
  rooms and reserves all of them or none (409 if there aren't enough free rooms any
  more). `GET /api/rooms/available` also returns `availableCounts`, the number
  of free rooms of each type.
- **Pay:** one payment covers every room of the booking still awaiting
  payment. The PaymentIntent's `metadata.reservationIds` lists them, and
  completing the booking marks exactly those rooms as booked.
  `paymentDetails.paymentAmount` on each room is that room's share.
- **Manage / cancel:** `/manage-reservation` shows and cancels the whole
  booking (`PATCH /api/rooms/cancel-reservation` with `scope: "booking"`).
  The account pages list each room separately and can cancel a single room.

## Adults, children and pets

The search asks for adults, children and pets (it starts at 2 adults). The
rules live in `lib/booking/occupancy.js`, used by both the UI and the API.
Each room has:

- 1 to 4 adults (every room needs an adult);
- up to 6 guests in total, children included;
- up to 2 pets, only in a **pet-friendly** room. There is no pet fee.
  Service animals aren't pets: they're welcome in every room.

When the search includes pets, the results show how many pet-friendly rooms
of each type are free. Room types that can't take the pets are greyed out
with the reason rather than hidden, as a multi-room group may only need one
room for its pets. The API (`lib/booking/reservations.js`) gives rooms with
pets a pet-friendly room, and gives rooms without pets rooms that don't take
pets where it can.

Data:

- **Rooms:** a room takes pets if its document has `petFriendly: true`
  (missing means no). **Before launch, set this on the real pet-friendly
  rooms in Firestore**: until then no room takes pets and guests with pets
  can't book.
- **Reservations:** each room stores `adults`, `children` and `pets`.
  `guestCount` is still saved (adults + children). Older reservations only
  have `guestCount`; those guests are shown as adults.
- **API:** `POST /api/rooms/reserve` takes
  `rooms: [{ typeId, adults, children, pets }]` (the older `guestCount` per
  room still works, as adults). `GET /api/rooms/available` also returns
  `petFriendlyCounts`, the number of free pet-friendly rooms of each type.

## Reservation holds

A reservation holds its rooms unpaid for **1 hour** (`lib/booking/holds.js`).
Each reservation records `createdAt` and `holdExpiresAt`. A guest who starts
paying near the end gets up to 15 more minutes, so the hold can't run out
mid-payment; no hold goes past 1 hour 15 minutes.

- **Releasing:** an unpaid reservation past `holdExpiresAt` is cancelled with
  `cancellationReason: "expired"` (and `cancelledAt`); its rooms are freed
  and the guest gets a "Reservation expired" email. (Cancellations by the
  guest are saved with `cancellationReason: "guest"`.) This happens whenever
  availability is searched, a booking is made, looked up or paid for, so it
  doesn't depend on a scheduled job.
- **Scheduled clean-up:** `GET /api/cron/release-holds` does the same, so
  the emails go out on time even when the site is quiet. Schedule it every
  few minutes (e.g. Vercel Cron); if `CRON_SECRET` is set, it needs
  `Authorization: Bearer <CRON_SECRET>`.
- **Older reservations:** unpaid reservations made before holds were
  recorded have no `holdExpiresAt`. They're released the first time this
  runs, **without** an email (they are much older than an hour).
- **Paying late:** if a payment finishes after the hold ran out, the rooms
  are booked anyway if they're still free. If someone else has taken them,
  the payment is refunded in full automatically and the guest is emailed
  (see below).
- Both durations can be shortened for testing: `RESERVATION_HOLD_MINUTES`,
  `PAYMENT_GRACE_MINUTES`.

## Search links

The availability search lives in the web address, so a refresh keeps it and
it can be shared:
`/make-reservation?from=2026-12-01&to=2026-12-03&adults=2&children=1&pets=1`
(`lib/booking/searchQuery.js`). Invalid values fall back to the defaults,
and dates in the past move to today (keeping the number of nights).

## Payments and security

The server decides what a booking costs and whether it has been paid. Never trust prices or payment results sent by the browser.

1. **Reserve** (`POST /api/rooms/reserve`): the server makes the booking ID (`lib/booking/bookingIds.js`, checked to be unused), picks the rooms and prices each stay from the room's stored price, the dates and the current discounts (`lib/pricing/bookingPrice.js`). It builds the reservations from an allow-list of fields (`lib/booking/reservations.js`). Price, room, `bookingStatus` (always `reserved`) and `paymentDetails` (always empty) sent by the browser are ignored.
2. **Pay** (`POST /api/stripe/payment-intent` with `{ reservationId }`): the server recomputes the price of every room of the booking awaiting payment and creates one Stripe PaymentIntent for the total, tagged with `metadata.reservationId` and `metadata.reservationIds`. If a recomputed price no longer matches the reserved total, it refuses (409) rather than charge a different amount.
3. **Complete**: the browser (`PATCH /api/rooms/booking` with `{ reservationId, bookingId, paymentIntentId }`) and Stripe (`POST /api/stripe/webhook`, event `payment_intent.succeeded`) both report the payment; whichever arrives first completes the booking (`lib/booking/completeBooking.js`), so it's completed even if the guest closes the tab. The server fetches the PaymentIntent from Stripe and marks the rooms `booked` only if the payment `succeeded`, for exactly those rooms of this booking, in CAD, for exactly their reserved total (`lib/booking/payments.js`). It then sends the confirmation email (once). Repeating either call is safe.
4. **Refund** when a succeeded payment can't book its rooms (the hold ran out and someone else took them, or the booking changed, e.g. it was paid twice from two tabs): the payment is refunded in full (one refund per payment, via a Stripe idempotency key), the refund is noted on the reservations (`refunds`) and the guest is emailed once. The browser gets `409 { code: "refunded" }`.

**Stripe setup:** in the Stripe dashboard (Developers > Webhooks) add the endpoint `https://<your site>/api/stripe/webhook` for the event `payment_intent.succeeded`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`. Requests without a valid signature are rejected.

### Known gaps (not fixed yet)

- **No server-side authentication.** The API routes use the Firebase *client* SDK without signing in. So Firestore security rules must allow unauthenticated access, which would let anyone with the public API key read and write Firestore directly, bypassing these checks. Move the API to the Firebase Admin SDK and lock down the Firestore rules. Until then, the `userId` sent with reservations and bookings can't be verified either.
  See [`SERVER_AUTH_PLAN.md`](./SERVER_AUTH_PLAN.md) for the plan to fix this.
- The confirmation-email endpoints under `/api/send-confirmation-email` send whatever recipient and details they're given (the booking confirmation, expiry and refund emails are now sent by the server itself), and reservation cancellation needs only the reservation ID (the room and dates to free are read from the stored reservation).
- Payment methods that finish later (Stripe status `processing`) aren't offered: the booking completes on `payment_intent.succeeded` only.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
