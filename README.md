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
| `AZJANERES1` | `jane@example.com`       | Reservation awaiting payment (2 nights)      |
| `AZJANERES2` | `jane@example.com`       | Reservation, 12 nights (5% discount)         |
| `AZJANEBKD1` | `jane@example.com`       | Booking, 4 guests                            |
| `AZJANEBKD2` | `jane@example.com`       | Booking, 22 nights (7.5% discount)           |
| `AZJANECAN1` | `jane@example.com`       | Cancelled                                    |
| `AZJANECIN1` | `jane@example.com`       | Checked in (hidden by the manage page)       |
| `AZJANEOUT1` | `jane@example.com`       | Checked out (hidden by the manage page)      |
| `AZJOHNRES1` | `john@example.com`       | Reservation awaiting payment                 |
| `AZJOHNBKD1` | `john@example.com`       | Booking, 35 nights (10% discount)            |

All dates are relative to the day the server starts, so there are always upcoming, current and past stays.

**Sold-out scenario:** every Presidential Suite is booked or under maintenance from **today + 14 to today + 17 days**. Search those dates on `/make-reservation` to see it disappear from the results.

### Mock payments

The booking page shows a mock card form instead of Stripe Elements. Like Stripe test mode, the card number decides the result. The outcome is decided on the server (`/api/mock/stripe/confirm`), so the booking step verifies mock payments exactly as it verifies real ones:

| Card number           | Result             |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Success            |
| `4000 0000 0000 0002` | Card declined      |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card       |

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

## Payments and security

The server decides what a booking costs and whether it has been paid. Never trust prices or payment results sent by the browser.

1. **Reserve** (`POST /api/rooms/reserve`): the server prices the stay from the room's stored price, the dates and the current discounts (`lib/pricing/bookingPrice.js`). It builds the reservation from an allow-list of fields (`lib/booking/reservations.js`). Price, room type, `bookingStatus` (always `reserved`) and `paymentDetails` (always empty) sent by the browser are ignored.
2. **Pay** (`POST /api/stripe/payment-intent` with `{ reservationId }`): the server recomputes the price and creates the Stripe PaymentIntent for that amount, tagged with `metadata.reservationId`. If the recomputed price no longer matches the reserved total, it refuses (409) rather than charge a different amount.
3. **Complete** (`PATCH /api/rooms/booking` with `{ reservationId, bookingId, paymentIntentId }`): the server fetches the PaymentIntent from Stripe. It marks the reservation `booked` only if the payment `succeeded`, for this reservation, in CAD, for exactly the reserved total (`lib/booking/payments.js`). Repeating the call with the same payment is safe.

### Known gaps (not fixed yet)

- **No server-side authentication.** The API routes use the Firebase *client* SDK without signing in. So Firestore security rules must allow unauthenticated access, which would let anyone with the public API key read and write Firestore directly, bypassing these checks. Move the API to the Firebase Admin SDK and lock down the Firestore rules. Until then, the `userId` sent with reservations and bookings can't be verified either.
- **No Stripe webhook.** A booking is only completed by the browser calling step 3. If the guest closes the tab right after paying, the payment succeeds but the reservation stays `reserved`. Handle `payment_intent.succeeded` in a webhook to complete those, and to support payment methods that finish later (`processing`).
- The confirmation-email endpoints send whatever recipient and details they're given, and reservation cancellation needs only the reservation ID.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
