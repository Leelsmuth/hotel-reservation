# Plan: server-side login checks

Status: **proposal, not started.** This is the last "known gap" in the
README. Everything else in the booking flow (prices, payments, holds,
refunds) is now decided on the server, but the server still can't tell who
is calling it, and the database is open to anyone.

## 1. The problem today

**The API talks to Firestore as an anonymous browser.** The API routes use
the Firebase *client* SDK (`lib/firebase/firebase.js`, used by
`lib/data/firestoreRepository.js`) without signing in. For that to work, the
Firestore security rules must let anyone read and write the `reservations`
and `rooms` collections. The Firebase config (`NEXT_PUBLIC_FIREBASE_*`) is
public by design, so **anyone can read every guest's reservation (names,
emails, phone numbers) and write to any reservation or room directly**. That
skips every check the API makes: prices, payment checks and holds.

**The API believes whatever the request says about who is calling:**

| Route | What anyone can do today |
| --- | --- |
| `GET /api/rooms/reserve/profile?userId=…` | List **any** user's reservations and bookings, by passing their user ID |
| `POST /api/rooms/reserve` | Say the reservation belongs to any `userId` |
| `PATCH /api/rooms/booking` | Attach a paid booking to any `userId` |
| `GET /api/rooms/booking?id=…` | Read a reservation in full (contact details included) with only its ID |
| `PATCH /api/rooms/cancel-reservation` | Cancel any reservation with only its ID |
| `POST /api/send-confirmation-email/*` (4 routes) | Send a hotel-branded email with any content to **any address** (an open relay) |
| `POST /api/update-data` | **Add rooms** to the hotel |
| `POST /api/auth/signup` | Create accounts; no rate limit |

Fine as they are: `GET /api/rooms/available` (public by nature),
`POST /api/stripe/webhook` (Stripe signature), `GET /api/cron/release-holds`
(`CRON_SECRET`), and `GET /api/rooms/reserve?bookingId&email` (the booking
ID and email act as the password).

Reservation IDs and booking IDs are long and random, which makes guessing
hard. But they appear in URLs, emails and browser history, so they're not
secrets.

## 2. Goal

1. Only the server can read or write reservations and rooms. The Firestore
   rules deny the browser everything except what it really needs.
2. Every API route knows who is calling (a verified Firebase user, a guest
   with proof of a booking, Stripe, or the scheduler) and checks they're
   allowed.
3. No open email relay, and no unauthenticated admin actions.

## 3. Design

### 3.1 Firebase Admin SDK on the server

- Add `firebase-admin`. `lib/firebase/admin.js` sets it up from a **service
  account** (env var `FIREBASE_SERVICE_ACCOUNT`, the JSON key, or Google's
  default credentials on Google Cloud).
- Rewrite `lib/data/firestoreRepository.js` on `firebase-admin/firestore`.
  The functions and their behaviour stay the same (they're listed in
  `lib/data/repository.js`), so the API routes and the mock repository don't
  change. The main API differences:
  - `db.collection('rooms').doc(id)` instead of `doc(db, 'rooms', id)`;
  - `transaction.get(ref)` returns a snapshot with `.exists` (a property,
    not a method);
  - `FieldValue.arrayUnion` instead of `arrayUnion`;
  - queries are chained: `.where(…).limit(…).get()`.
- `signUpUser` moves to `admin.auth().createUser()` plus the `users/{uid}`
  document. The server no longer signs anyone in.
- API routes must run on the Node.js runtime (the Admin SDK doesn't work on
  the Edge runtime). That's already the default; we'll just keep it that way.

### 3.2 Knowing who is calling

- **Signed-in guests:** the browser sends its Firebase ID token with each
  API call (`Authorization: Bearer <token>`), through a small
  `fetchWithAuth()` helper built on `authClient.getIdToken()`. That method
  needs adding to both auth clients. The mock client returns a mock token.
- `lib/auth/serverAuth.js` has `getCaller(request)`. It checks the token
  with `admin.auth().verifyIdToken()` and returns `{ uid, email,
  emailVerified, isAdmin }`, or `null` for a guest. In mock mode it checks
  mock tokens the same way, so mock mode keeps working like production.
- `userId` is **never** read from a request body or URL again. It comes
  from the verified token.
- **Guests without an account** prove a booking is theirs with the booking
  ID + email, as they already do on Manage booking. Two options:
  - **(a) Recommended:** a booking access token. After a successful lookup,
    or when reserving, the server returns a short-lived signed token (an
    HMAC with `BOOKING_ACCESS_SECRET`, about 24 hours, naming the booking).
    The browser sends it to the booking, payment and cancel routes. No
    emails in URLs, and nothing extra to type.
  - **(b)** Send the booking ID + email with every call. Simpler, but the
    email ends up in more requests.
- **Admins:** a Firebase custom claim `admin: true`, set with the Admin SDK,
  replaces trusting `isAdmin` in the `users` document.

### 3.3 Who may call what

| Route | Allowed caller | Check |
| --- | --- | --- |
| `GET /api/rooms/available` | Anyone | (none) |
| `POST /api/rooms/reserve` | Anyone | `userId` taken from the token if signed in, otherwise none. Returns a booking access token. |
| `GET /api/rooms/reserve?bookingId&email` | Anyone | Returns a booking access token when found. Rate-limited. |
| `GET /api/rooms/reserve/profile` | Signed-in user | Lists **the caller's own** reservations (the `userId` parameter is removed) |
| `GET /api/rooms/booking?id` | Owner or booking access token | The signed-in owner, or a token for that booking |
| `POST /api/stripe/payment-intent` | Owner or booking access token | Same |
| `PATCH /api/rooms/booking` | Owner or booking access token | Same; links the booking to the caller's account if signed in |
| `PATCH /api/rooms/cancel-reservation` | Owner or booking access token | Same |
| `POST /api/stripe/webhook` | Stripe | Signature (already done) |
| `GET /api/cron/release-holds` | Scheduler | `CRON_SECRET` (already done; make it required in production) |
| `POST /api/update-data` | Admin | `admin` claim, or delete the route if it isn't used |
| `POST /api/auth/signup` | Anyone | Rate-limited |
| `POST /api/send-confirmation-email/*` | **Removed** | The server sends these emails itself (see 3.4) |

### 3.4 Emails

The server already sends the booking confirmation, expiry and refund
emails. The remaining three move into the routes that cause them:

- the reservation confirmation, into `POST /api/rooms/reserve`;
- both cancellation emails, into `PATCH /api/rooms/cancel-reservation`.

Then all four `/api/send-confirmation-email/*` routes are deleted. The
booking one is already unused.

### 3.5 Firestore security rules

A `firestore.rules` file in the repository, deployed with the Firebase CLI:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Length-of-stay discounts: shown live on the site
    match /discounts/{id} { allow read: if true; allow write: if false; }
    // A signed-in user's own profile (read by the browser's auth client)
    match /users/{uid} { allow read: if request.auth != null && request.auth.uid == uid;
                         allow write: if false; }
    // Everything else: server only (the Admin SDK isn't subject to rules)
    match /{document=**} { allow read, write: if false; }
  }
}
```

The browser only reads `discounts/daysDiscount` (`lib/data/discounts.js`)
and `users/{uid}` (`lib/auth/firebaseAuthClient.js`) directly. Everything
else already goes through the API.

**⚠ Check-in and check-out happen outside this app.** Reservations have
`checkedInBy`/`checkedOutBy`, but this repository has no front-desk
screens. Whatever sets them (another app, or people editing in the Firebase
console) will **stop working** once the rules are locked down, unless it
uses the Admin SDK or the console. We need to find out what it is before
step 5 below.

### 3.6 Rate limiting (recommended, can follow later)

Limit booking lookups, reservations and sign-ups per IP address (for
example with Vercel KV / Upstash). This stops booking-ID guessing and one
person holding many rooms through many unpaid reservations.

## 4. Rollout

Each step ships separately and is checked on staging with the QA checklist
(`QA_MULTI_ROOM_BOOKINGS.md`) before going to production.

1. **Admin SDK repository.** Same behaviour; the server stops depending on
   open rules. Nothing changes for guests.
2. **Who is calling.** ID tokens from the browser, `getCaller()`, booking
   access tokens, and the access checks in 3.3. The browser and server
   deploy together, so there's no transition period.
3. **Emails moved to the server.** Delete the relay routes. Lock or delete
   `/api/update-data`. Make `CRON_SECRET` required.
4. **Admin claim.** Set `admin: true` for the staff accounts that need it.
5. **Lock down Firestore**: deploy `firestore.rules`, after confirming the
   check-in tool (3.5) won't break. This is the step that actually closes
   the hole; steps 1–4 make it safe to take.
6. **Rate limiting** (3.6).

Rollback: steps 1–4 are ordinary deploys. For step 5, keep the current
rules file so it can be redeployed in a minute.

## 5. Testing

- **Locally:** the Firebase Emulator Suite (Auth + Firestore), so the Admin
  SDK repository and the rules run without touching real data. Point the app
  at it with `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST`.
- **Rules tests** with `@firebase/rules-unit-testing`:
  - the browser can read the discounts and its own user document, and
    nothing else;
  - it can't write anything.
- **API tests for every route in 3.3:** no token, another user's token, an
  expired or tampered token, a booking access token for a different
  booking, and the right caller.
- **Mock mode keeps working** (tokens are simulated), so the current mock
  test suites keep running, plus the new access cases.
- **QA on staging:** the full checklist, plus: sign in as one user and try
  to open another user's booking link. It must be refused.

## 6. What's needed from you

1. **A Firebase service account** for staging, and later production, plus
   a place to store it as a secret (e.g. Vercel environment variables).
2. **A staging Firebase project**, or confirmation that the emulator plus
   the current project is acceptable for testing.
3. **Who can deploy Firestore rules** (the Firebase CLI with project
   access).
4. **What does check-in and check-out today?** See 3.5.
5. **Decision: how guests prove a booking is theirs.** A booking access
   token (recommended) or the booking ID + email on every call.
6. **Which staff accounts are admins**, for the custom claim, and whether
   `/api/update-data` (add a room) is still used or can be deleted.

## 7. Size

Roughly the same size as the multi-room booking work. Step 1 (the Admin SDK
repository) and step 2 (access checks and booking tokens) are most of it.
Steps 3–5 are small but need care and coordination, especially the rules
deployment.
