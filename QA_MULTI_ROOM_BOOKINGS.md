# QA checklist: booking changes

This checklist covers these changes:

- Guests can book several rooms (same dates) in one reservation, with one
  booking ID and one payment. (Sections A–G.)
- The search asks for adults, children and pets, some rooms are
  pet-friendly, and every room follows these rules (section H):
  - 1–4 adults, and every room needs at least one;
  - up to 6 guests in total, children included;
  - up to 2 pets, only in a pet-friendly room, with no pet fee.

- Search links, server-made booking IDs, the 1-hour hold on unpaid
  reservations, and payments that complete through Stripe's webhook (with
  automatic refunds). (Sections I–L.)

The existing single-room flow must keep working (section F). Section M lists
the checks that can only be done on staging.

## Setup

1. Node 22. In `hotel-reservation/`: `npm install`, then `npm run dev:mock`.
2. Open http://localhost:3000.
3. Keep the terminal visible: in mock mode, emails are printed there instead
   of being sent.

Good to know:

- **Data resets when you restart the server.** Some cases change the demo
  data (they pay or cancel it). Restart the server before each section to
  start clean.
- **Unpaid demo reservations expire about 55 minutes after the server
  starts** (they hold their rooms for 1 hour, like real ones). If a case
  needs one and it's gone, restart the server.
- Dates in the demo data are relative to today. "Today+14" means 14 days
  from today.
- The first visit to each page after starting the server takes a few seconds
  while it compiles.
- Demo logins all use the password `Password123`.
- **Guests** on the search is a pop-up with − / + buttons for **Adults**,
  **Children** and **Pets**. It starts at **2 adults**. "Set Adults to 8"
  below means: open Guests, press + or − until Adults shows 8, then **Done**.
- Test cards (any future expiry, any CVC):
  - `4242 4242 4242 4242` succeeds.
  - `4000 0000 0000 0002` is declined.

**Prices for 1 night, including 13% tax** (handy for checking totals):

| Room               | Per night | 1 night incl. tax |
| ------------------ | --------- | ----------------- |
| Queen Room         | $120      | $135.60           |
| King Room          | $135      | $152.55           |
| Deluxe Room        | $150      | $169.50           |
| Presidential Suite | $350      | $395.50           |

The default search is today to tomorrow (1 night).

---

## A. Making a booking

### A1. Group of 8 (more guests than one room holds)

1. Go to **Book a room**. Set **Adults** to 8. Click **Check availability**.
2. **Expected:** a blue box says **"Your group needs at least 2 rooms"** and
   explains that each room sleeps up to 4 adults and 6 guests in total. The
   old text "Reserve each room separately" is gone.
3. Click **Reserve** on **King Room**.
4. **Expected:**
   - A box says **"We've added 2 rooms for your 8 adults"**.
   - Under "Rooms", **Room 1** and **Room 2** are both King Room with
     4 adults each.
   - The summary on the right says **"2 rooms"** and lists both rooms.
   - There is one price line per room. The total is **$305.10**.
   - The main button reads **"Reserve 2 rooms – pay on the next step"**.

### A2. Mix of room types (4 adults who don't want to share) and pay

1. Set **Adults** to 4. Click **Check availability**.
2. Click **Reserve** on **Deluxe Room**.
3. **Expected:** one room (Deluxe, 4 adults). No "We've added…" box.
4. Click **Add another room**. Change **Room 2**'s room type to
   **King Room**. Set **Adults** to **2** in each room.
5. **Expected:**
   - The summary lists Deluxe Room (2 adults) and King Room (2 adults).
   - The total is **$322.05**.
   - There is no yellow "Not everyone has a room yet" warning.
6. Fill in your name, email and phone number. Click **Reserve 2 rooms**.
7. **Expected:** the page says **"Your 2 rooms are reserved"**, shows a
   booking ID, and says you'll pay for all the rooms in one payment. Note
   the booking ID.
8. Click **Continue to payment as a guest**.
9. **Expected:**
   - The checkout says "Your 2 rooms are reserved. Pay for them together…".
   - The summary shows "Room 1: $150.00 × 1 night" and
     "Room 2: $135.00 × 1 night".
   - The total to pay is $322.05, and the button says **Pay $322.05**.
10. Pay with `4242 4242 4242 4242`.
11. **Expected:** **"Your booking is confirmed"**, and the text says
    "…your 2 rooms are booked…".

### A3. Adding, removing and the guest warning

1. Repeat A1 up to step 4 (2 King Rooms, 4 adults each).
2. Change Room 2's **Adults** to **2**.
3. **Expected:** a yellow box says **"Not everyone has a room yet: 2
   adults"**. The "We've added…" box disappears.
4. Click **Add another room**.
5. **Expected:** Room 3 appears with **2 adults** (the adults not yet
   placed). The yellow box disappears.
6. Click **Remove** on Room 2.
7. **Expected:** the rooms are renumbered Room 1 and Room 2, and the summary
   and total update.
8. Remove rooms until only one is left.
9. **Expected:** the last room has no **Remove** button.

### A4. Going back to the room list

1. Get to the details step with 2 rooms (as in A1). Click **Back to rooms**.
2. **Expected:**
   - A box at the top says **"Your booking so far: 2 rooms · 8 adults"**,
     with the room names (for example "2 × King Room").
   - It has a **Continue with 2 rooms** button and a **Start over** button.
   - The room cards now say **Add to booking** instead of Reserve.
3. Click **Add to booking** on **Queen Room**.
4. **Expected:** you're back on the details step with 3 rooms, and the Queen
   Room is Room 3.
5. Click **Back to rooms**, then **Start over**.
6. **Expected:** the box is gone and the cards say **Reserve** again.

### A5. Only as many rooms as are free, at most 10

1. Search **8 adults**. Click **Reserve** on **Presidential Suite** (2 suites
   are added).
2. Click **Add another room** twice.
3. **Expected:** Rooms 3 and 4 are also Presidential Suites. A new room
   starts as the same type as the room above it while that type is free.
4. Click **Add another room** once more.
5. **Expected:**
   - Room 5 starts as a **Queen Room**, because only 4 suites are free.
   - In Room 5's dropdown, "Presidential Suite" shows **"(none left)"** and
     can't be picked.
6. Click **Back to rooms**.
7. **Expected:** the Presidential Suite card says **"Every free Presidential
   Suite is already in your booking."** instead of a button.
8. Click **Start over**. Search **30 adults**. Click **Reserve** on **Queen
   Room**.
9. **Expected:** 8 rooms are added (4 adults each, except the last two with
   3).
10. Click **Add another room** until it greys out.
11. **Expected:**
    - It stops at **10 rooms**.
    - The text under the button says **"You can book up to 10 rooms online.
      For larger groups, please contact us."**

### A6. Changing dates after choosing rooms

The demo data has every Presidential Suite booked from today+14 to today+17.

1. Search **8 adults** for the default dates. Click **Reserve** on
   **Presidential Suite** (2 suites).
2. Click **Add another room**, and set it to **Queen Room**.
3. Click **Change dates**. Pick **today+14 to today+17**. Click **Check
   availability**.
4. **Expected:**
   - A yellow box says **"2 rooms you picked aren't free for these dates"**
     and "We've taken them out of your booking…".
   - "Your booking so far" shows just the **Queen Room**.
5. Repeat with only suites in the booking.
6. **Expected:** the box says "Choose a room below to start again", and no
   rooms are left in the booking.

### A7. Long-stay discount over several rooms

1. Pick a 12-night stay about 3 months from now. Set **6 adults**. Click
   **Check availability**.
2. Click **Reserve** on **King Room**.
3. **Expected:**
   - There are 2 King Rooms with **3 adults each**.
   - The summary shows **"Long-stay discount (5%)"** of **−$162.00**.
   - The total is **$3,478.14**.

### A8. Two guests going for the same last rooms

You need two browser windows (for example a normal window and a private one).

1. In **both** windows: choose the same dates about 10 months out and
   **8 adults**. Click **Reserve** on **Presidential Suite**. Click **Add
   another room**, set Room 3 to **Presidential Suite** (3 suites), and fill
   in contact details.
2. Window 1: click **Reserve 3 rooms**.
3. **Expected:** "Your 3 rooms are reserved".
4. Window 2: click **Reserve 3 rooms**.
5. **Expected:**
   - A red box **"We couldn't reserve your rooms"** appears, with "…Only 1
     Presidential Suite is available for these dates, not 3."
   - A yellow box says 2 rooms were taken out.
   - One suite is left in the booking.
   - Nothing was reserved for window 2. Check with the manage-booking page
     if you like.
6. Window 2: click **Reserve room**.
7. **Expected:** the remaining suite is reserved.

### A9. Signed-in guest

1. Log in as `jane@example.com`. Book 2 rooms (as in A1 or A2), but don't
   pay.
2. Go to **My account → Awaiting payment**.
3. **Expected:** both rooms are listed as separate cards with the same
   booking ID (see section D for what the cards should show).

---

## B. Payment

### B1. Declined card, then success

1. Reserve 2 rooms and continue to payment.
2. Pay with `4000 0000 0000 0002`.
3. **Expected:** "Payment failed", and the rooms are still awaiting payment.
4. Pay with `4242 4242 4242 4242`.
5. **Expected:** the booking is confirmed, and both rooms show as paid on the
   manage-booking page.

### B2. Nothing can be paid twice

1. After B1, use the browser's Back button to return to the checkout page.
2. **Expected:** you can't pay again (the page sends you away).

---

## C. Manage booking (booking ID + email, no login)

Restart the server first.

### C1. Paid 3-room booking

1. Go to **Manage booking**. Enter booking ID `AZGUESTGP1` and email
   `gary.guest@example.com`.
2. **Expected:**
   - Badge: **"Paid & confirmed"**. The card says **"3 rooms"** and lists
     Queen Room (4 adults), Queen Room (4 adults) and King Room (2 adults).
     (This booking was made before adults and children were recorded, so
     its guests show as adults.)
   - Guests: **"3 rooms · 10 adults"**.
   - **Total paid $1,271.25**.
   - The cancel section says "All 3 rooms are cancelled together."

### C2. Cancel the whole booking

1. In C1, click **Cancel booking**.
2. **Expected:** the dialog says "All 3 rooms in this booking will be
   cancelled". It shows Amount paid $1,271.25, a 30% fee of −$381.38, and a
   refund of $889.88.
3. Click **Yes, cancel booking**.
4. **Expected:**
   - You're sent to the home page.
   - Looking the booking up again shows **"Cancelled"** and "The rooms have
     been released".
   - A cancellation email appears in the terminal.

### C3. Unpaid 2-room booking

1. Look up `AZJANEGRP1` with `jane@example.com`.
2. **Expected:**
   - Badge: **"Awaiting payment"**.
   - Deluxe Room and King Room, 2 adults each, **Total $644.10**.
   - The text says "All 2 rooms are cancelled together."
3. Click **Continue to payment as a guest**.
4. **Expected:** the checkout shows both rooms and **Pay $644.10**.

---

## D. My account pages

Restart the server first. Log in as `jane@example.com`.

### D1. Rooms of one booking

1. Go to **My account → Awaiting payment**.
2. **Expected:**
   - The two `AZJANEGRP1` cards say **"Room 1 of 2 in this booking"** and
     **"Room 2 of 2 in this booking"**.
   - Each card has a **Pay for 2 rooms** button and a **Cancel room** button.
   - Jane's single-room reservations (`AZJANERES1`, `AZJANERES2`) look as
     before, with **Pay now** and **Cancel** buttons.

### D2. Cancel one room, pay for the rest

1. On the **Room 2 of 2** card (King Room), click **Cancel room**.
2. **Expected:** the dialog title is **"Cancel this room?"** and it says "The
   other rooms in this booking stay reserved."
3. Confirm.
4. **Expected:** one `AZJANEGRP1` card is left (Deluxe Room). Its button now
   says **Pay now**.
5. Click **Pay now**.
6. **Expected:** the checkout shows only the Deluxe Room, **Pay $339.00**.
7. Pay with `4242 4242 4242 4242`.
8. Go to **Confirmed bookings**.
9. **Expected:** the Deluxe Room card shows "Room 1 of 2 in this booking" and
   a **Cancel room** button. Cancelling it shows the 30% fee for that room
   only.

---

## E. Emails (printed in the terminal in mock mode)

1. After reserving 2 rooms (A2), check the reservation email.
2. **Expected:**
   - It shows **Rooms: 2**.
   - It has one line per room, for example "Room 1: Deluxe Room, 2 adults,
     $169.5 CAD". Children and pets are listed when there are any.
   - It shows **Guests: 4 adults**, a **Pets** line when there are pets, and
     the combined **Total Price**.
   - Prices are shown without trailing zeros ($169.5, not $169.50). That is
     how these emails always showed prices.
3. Check the booking confirmation email (after paying) and the cancellation
   email (C2).
4. **Expected:** they list the rooms the same way.
5. **Expected:** emails for single-room bookings have a Room Type line and a
   **Guests** line (for example "2 adults, 1 child"), plus **Pets** when there
   are pets. There is no room list. ("Guest Count: 2" became "Guests: 2
   adults".)

---

## F. Single-room bookings (regression: must be unchanged)

1. Search with the default **2 adults** and reserve **Queen Room**.
2. **Expected:**
   - The summary shows "Queen Room", "1 room · 2 adults" and
     "$120.00 × 1 night", total $135.60.
   - The button says **"Reserve room – pay on the next step"**.
   - There is no Remove button.
3. Reserve it.
4. **Expected:** **"Your room is reserved"**.
5. Pay.
6. **Expected:** "…your room is booked…".
7. Search 4 adults and reserve any room.
8. **Expected:** one room with 4 adults, and no "We've added…" box.
9. Look up existing bookings from before this change: `AZJANERES1`
   (jane@example.com, unpaid) and `AZGUESTBK1` (gary.guest@example.com,
   paid).
10. **Expected:** they display, pay and cancel exactly as before.
11. Look up `AZJANECIN1` (checked in).
12. **Expected:** still "Booking not found", as before.
13. **Expected:** older bookings show their guests as adults, for example
    `AZGUESTBK1` shows "1 room · 2 adults" (it used to say "2 guests").

---

## G. Accessibility and mobile

1. Keyboard only: on the details step, Tab to **Add another room** and press
   Enter.
2. **Expected:** focus moves to the new room's **Room type** dropdown.
3. Press Enter on a **Remove** button.
4. **Expected:** focus moves to **Add another room**.
5. With a screen reader, repeat steps 1–3.
6. **Expected:** it announces "Room N added." or "Room N removed." Each room
   is announced as a group ("Room 1"), and each dropdown has a label.
7. On a phone, or with the browser narrowed to 390px wide, run A1 and A2.
8. **Expected:** rooms stack vertically, nothing scrolls sideways, and the
   total above the Reserve button includes all rooms ("Total for 2 rooms,
   1 night…").

---

## H. Adults, children and pets

Restart the server first. Use the default dates (today to tomorrow) unless a
case says otherwise. On those dates these pet-friendly rooms are free:
2 Queen, 2 King and 1 Deluxe. No Presidential Suite takes pets.

### H1. The Guests picker

1. On the home page, look at **Guests**.
2. **Expected:** it says **"2 adults"**.
3. Open it.
4. **Expected:**
   - There are **Adults**, **Children** and **Pets** rows, each with − / +
     buttons.
   - Under Pets: "No fee. Up to 2 per room, in pet-friendly rooms."
   - A note: "Service animals are welcome in every room and aren't counted
     as pets."
5. Set Adults to **1**. Press + on Children until it stops, then + on Pets
   until it stops.
6. **Expected:** Children stops at **5** and Pets at **2** (one adult can
   have up to 5 children and 2 pets). The + buttons look greyed out at the
   limit.
7. Press + on Adults twice, then + on Children twice.
8. **Expected:** the button reads **"3 adults, 7 children, 2 pets"**, and
   under it **"You'll need at least 2 rooms."**
9. Press − on Adults twice.
10. **Expected:** **"1 adult, 5 children, 2 pets"**. Children and pets are
    lowered to fit 1 adult.
11. Press **Escape**.
12. **Expected:** the pop-up closes and focus is back on the Guests button.
13. Keyboard only: Tab into the pop-up, and use Enter or Space on − / +.
14. **Expected:** the numbers change. A screen reader announces them (for
    example "3 adults").
15. Click **Check availability**.
16. **Expected:** the results line under the heading shows the same party.

### H2. Who fits in a room

1. Search the default 2 adults and reserve any room.
2. Open Room 1's **Adults** dropdown.
3. **Expected:** the choices are 1 to 4 adults. There's no "0 adults".
4. Set Adults to **4**.
5. **Expected:** **Children** offers 0 to 2.
6. Set Adults to **1**.
7. **Expected:** Children offers 0 to 5. A room never holds more than
   6 people.
8. Set 3 children, then change Adults to **4**.
9. **Expected:** Children drops to 2 by itself.

### H3. One room with a pet

1. Search **2 adults, 1 child, 1 pet**.
2. **Expected:**
   - Queen, King and Deluxe Rooms are listed first. Each shows a paw line:
     "2 pet-friendly rooms free" (Queen, King) or "1 pet-friendly room
     free" (Deluxe).
   - The **Presidential Suite** is last and greyed out:
     - badge "Not for pets on these dates";
     - "No pet-friendly rooms for these dates";
     - "No pet-friendly Presidential Suites are free for these dates.";
     - no Reserve button.
   - "How pricing works" includes "Pets stay free in pet-friendly rooms, up
     to 2 per room."
3. Click **Reserve** on **King Room**.
4. **Expected:**
   - Room 1 is a King Room with 2 adults, 1 child and 1 pet.
   - A **Pets** field is shown with "Up to 2. No fee."
   - The summary says **"1 room · 2 adults, 1 child, 1 pet"**.
   - The total is **$152.55**, the same as without a pet.
5. Open Room 1's **Room type**.
6. **Expected:** "Presidential Suite" is greyed out with "(no pet-friendly
   rooms left)".
7. Reserve and pay.
8. **Expected:**
   - The emails show "Guests: 2 adults, 1 child" and "Pets: 1".
   - The manage-booking page shows "1 room · 2 adults, 1 child, 1 pet".

### H4. A group with pets that picks a room type without pets

1. Search **6 adults, 3 children, 3 pets**.
2. **Expected:**
   - The blue box says "Your group needs at least 2 rooms" and mentions
     "Pets stay in pet-friendly rooms, up to 2 per room."
   - The Presidential Suite still has a **Reserve** button: a group can put
     its pets in other rooms.
3. Click **Reserve** on **Presidential Suite**.
4. **Expected:**
   - There are 2 rooms, both **Queen Rooms**. Room 1 has 3 adults,
     2 children and 2 pets. Room 2 has 3 adults, 1 child and 1 pet. (3 pets
     need 2 pet-friendly rooms.)
   - A box explains: "No pet-friendly Presidential Suites are free for your
     dates, so your pets are in a pet-friendly Queen Room."
5. Set Room 2's **Pets** to "No pets".
6. **Expected:** a yellow box says **"Not everyone has a room yet: 1 pet"**.
7. Change Room 2's room type to **Presidential Suite**.
8. **Expected:**
   - Its Pets choices are greyed out.
   - The hint says "No pet-friendly Presidential Suites left for these
     dates. Choose another room type for pets."
9. Fill in contact details and reserve.
10. **Expected:** "Your 2 rooms are reserved". The warning doesn't block
    reserving.

### H5. No pet-friendly rooms for the dates

The demo data has every pet-friendly room booked from today+30 to today+33.

1. Search **today+30 to today+33** with **2 adults, 1 pet**.
2. **Expected:**
   - A yellow box says **"No pet-friendly rooms are free for these dates"**
     and "Try other dates to bring your pet. Service animals are welcome…".
   - Every room card is greyed out with "Not for pets on these dates".
   - There are no Reserve buttons.
3. Set Pets to 0 and search again.
4. **Expected:** rooms can be reserved as normal.

### H6. Taking the last pet-friendly room of a type

1. Search **2 adults, 1 pet**. Reserve the **Deluxe Room** and complete the
   reservation. Paying isn't needed.
2. Search the same dates with **2 adults, 1 pet** again.
3. **Expected:**
   - The Deluxe Room card is greyed out with "No pet-friendly Deluxe Rooms
     are free for these dates."
   - Queen and King still show pet-friendly rooms.
4. Search the same dates with **no pets**.
5. **Expected:** the Deluxe Room can be reserved. Its other rooms don't take
   pets but are free.

### H7. Where the party is shown

1. **Manage booking:** look up `AZPETFAM1` with `paula.pet@example.com`.
2. **Expected:**
   - "2 rooms".
   - Room 1: King Room, "2 adults, 2 children, 1 pet".
   - Room 2: King Room, "2 adults, 2 pets".
   - Guests: "2 rooms · 4 adults, 2 children, 3 pets".
   - **Total paid $915.30.**
3. **My account:** log in as `jane@example.com` and go to **Confirmed
   bookings**.
4. **Expected:** the cards read, for example, "3 nights · 4 adults".
5. **Room pages:** open **Rooms** and a room's page (for example King Room).
6. **Expected:**
   - "Up to 4 adults · 6 guests".
   - The rate box says "Per room, for up to 4 adults (6 guests with
     children)".
7. On the **Book a room** results, click **All amenities** on any room card.
8. **Expected:** it lists **"Pet-friendly rooms"**, not "Pet-friendly".

## I. Search in the web address

### I1. A shared link

1. Open `http://localhost:3000/make-reservation?from=<today+10>&to=<today+13>&adults=3&children=1&pets=1`.
   Use real dates in the `YYYY-MM-DD` format.
2. **Expected:**
   - **Guests** shows "3 adults, 1 child, 1 pet".
   - The dates show your 3 nights.
   - The results line shows the same search, and the cards show pet-friendly
     rooms.

### I2. A new search, then refresh

1. On the results, change the search (for example to 2 adults, no pets).
   Click **Check availability**.
2. **Expected:** the address changes to match, e.g. `…?from=…&to=…&adults=2`.
3. Refresh the page.
4. **Expected:** the same search and results. (Rooms you'd picked on "Your
   details" aren't kept: you're back on the results.)
5. Copy the address into a private window.
6. **Expected:** the same search.

### I3. From the home page

1. On the home page, choose dates and 5 adults and 2 children. Click
   **Check availability**.
2. **Expected:** you land on
   `/make-reservation?from=…&to=…&adults=5&children=2`, with results for
   that search.

### I4. Bad or old links

1. Open `/make-reservation?from=2020-01-10&to=2020-01-12&adults=99&children=-4&pets=abc`.
2. **Expected:**
   - The dates become **today for 2 nights** (the number of nights is
     kept).
   - Guests shows "30 adults", the most allowed.
   - The address is corrected.
3. Open `/make-reservation?from=garbage&adults=1`.
4. **Expected:** today to tomorrow, "1 adult".

### I5. The Back button

1. Go to **Rooms**, then **Book a room**. Run three different searches.
   Press the browser's **Back** button.
2. **Expected:** you're back on **Rooms**. Searches don't pile up in the
   history.

## J. Booking IDs

1. Make two reservations.
2. **Expected:**
   - Each booking ID is "AZ" followed by 8 letters or digits, and the two
     are different.
   - The ID on the confirmation page matches the one in the email.
3. **Expected (developer tools, Network tab):** the reservation request
   doesn't send a booking ID. The server makes it.

## K. The 1-hour hold

You don't need to wait an hour. To end a hold now, run this in a **second
terminal** while the server is running:

```bash
npm run mock:expire-holds -- <booking ID>
```

It prints, for example, `Expired AZ7K2M9Q4X (2 rooms): cancelled, reason
"expired".` From then on the booking is handled exactly as after a real hour.
Without a booking ID it expires every booking awaiting payment.

K4 is the only case that needs a real, short hold (see there).

### K1. Unpaid demo reservations that had already expired

1. Start the server. Look up `AZGUESTEXP1` with `eve.expired@example.com`.
2. **Expected:**
   - The badge is **"Cancelled · expired"**.
   - The box is titled "This reservation expired": "It wasn't paid within
     1 hour, so it was cancelled and the room was released. You haven't
     been charged."
   - There's a **Book again** button.
   - The terminal shows **one** "Reservation Expired - AZGUESTEXP1" email.
3. Look up `AZOLDRES01` with `oscar.old@example.com`.
4. **Expected:** also expired, but there is **no** email for it. It's
   older than the hold, so it's released without one.

### K2. A hold runs out

1. Reserve 2 rooms (any dates). Don't pay. Note the booking ID and how many
   rooms of that type are free.
2. Run `npm run mock:expire-holds -- <booking ID>`, then search the same
   dates.
3. **Expected:**
   - Those rooms are free again (the counts go back up).
   - Manage booking shows **"This reservation expired"** with a **Book
     again** button.
   - The terminal has **one** "Reservation Expired" email, listing both
     rooms.
   - Signed in: the reservation is gone from **Awaiting payment**.
4. Run the same command again.
5. **Expected:** "No reservation awaiting payment has booking ID … It may
   already be paid, cancelled or expired."

### K3. Opening the payment page too late

1. Reserve, and stay on the confirmation page.
2. Run `npm run mock:expire-holds -- <booking ID>`.
3. Click **Continue to payment**.
4. **Expected:** "This reservation has expired" with **Book again**. There
   is no payment form.

### K4. Paying near the end of the hold

This case needs a real (short) hold. Restart the server with
`RESERVATION_HOLD_MINUTES=2 PAYMENT_GRACE_MINUTES=1 npm run dev:mock`. The
hold is then 2 minutes, plus up to 1 more once the payment page is open.
The pages still say "1 hour".

1. Reserve. After about 1¾ minutes, open the payment page. This extends
   the hold to about 2¾ minutes.
2. About 2¼ minutes after reserving (past the normal 2-minute hold), pay
   with `4242 4242 4242 4242`.
3. **Expected:** the booking is confirmed. Opening the payment page gave
   extra time.

### K5. Paying late while the rooms are still free

1. Reserve and open the payment page, but don't pay.
2. Run `npm run mock:expire-holds -- <booking ID>`.
3. Pay on the payment page you left open.
4. **Expected:** the booking is confirmed anyway, and its rooms show as
   taken again in search.

### K6. Paying late after someone else took the rooms

1. Reserve **1 Presidential Suite** for some dates and open the payment
   page. Don't pay.
2. Run `npm run mock:expire-holds -- <booking ID>`.
3. In another window, book all 4 Presidential Suites for the same dates.
   Reserving is enough.
4. Back in the first window, pay.
5. **Expected:**
   - **"We've refunded your payment"**: "Your reservation expired before
     your payment went through, and its rooms have been booked by someone
     else. We've refunded your payment in full."
   - There is no "don't pay again" error.
   - The terminal has **one** "Payment Refunded" email with the amount.
   - Manage booking shows the reservation as **Cancelled · expired**.

### K7. The clean-up endpoint

1. Open `http://localhost:3000/api/cron/release-holds`.
2. **Expected:** `{"released":[…]}`. The list is empty if nothing has
   expired since the last search.

## L. Payments completing without the browser (Stripe webhook)

### L1. The guest closes the tab right after paying

1. On the payment page, click **"Mock: pay, then close the tab"** (below
   the Pay button).
2. **Expected:** "Mock: payment sent, tab "closed"".
3. A few seconds later, look the booking up on Manage booking.
4. **Expected:**
   - **Paid & confirmed.**
   - The terminal has **one** "Booking Confirmation" email, sent by the
     server.

### L2. A normal payment sends one email

1. Pay normally.
2. **Expected:** exactly **one** "Booking Confirmation" email, even though
   both the page and the webhook report the payment.

### L3. Paying twice from two tabs

1. Reserve. Open the payment page in **two tabs**.
2. Pay in the first tab.
3. **Expected:** booking confirmed.
4. Pay in the second tab.
5. **Expected:**
   - "We've refunded your payment": "Your reservation changed before your
     payment went through (it may already be paid for or cancelled). We've
     refunded this payment in full."
   - Manage booking shows the booking paid once.
   - The terminal has one "Payment Refunded" email.

### L4. Signing in to pay

1. Reserve as a guest. On the confirmation page, **Log in** as
   `new@example.com` and pay.
2. **Expected:** the booking is under **My account → Confirmed bookings**.

## M. On staging (real Firebase and Stripe test mode)

First:

- In Firestore, set **`petFriendly: true`** on the rooms that take pets.
  Without it, no room takes pets and every search with pets shows none free.
- In the Stripe dashboard (test mode), add the webhook endpoint
  `https://<staging site>/api/stripe/webhook` for `payment_intent.succeeded`,
  and set **`STRIPE_WEBHOOK_SECRET`**.
- Schedule `GET /api/cron/release-holds` every few minutes, and set
  **`CRON_SECRET`**.

Mock mode can't test these. Run A2 (2 rooms, paid), C2 (cancel) and H3 (one
room with a pet) on staging, then check:

1. **Firestore `reservations`:**
   - There are **2 documents** with the same `bookingId`.
   - Each has `groupReservationIds` listing both document IDs.
   - Each has its own `roomTypeId`, `guestCount` and `totalPrice`.
   - After payment, both are `bookingStatus: "booked"`. They share the same
     `paymentDetails.paymentIntentId`, and each `paymentAmount` is that
     room's share in cents.
2. **Firestore `rooms`:** the two booked rooms are different rooms. Each has
   the stay's dates in `bookings`. After cancelling, those dates are removed.
3. **Stripe dashboard (test mode):**
   - There is **one** PaymentIntent, for the combined total in CAD.
   - Its metadata has `bookingId`, `reservationId` and `reservationIds`
     (both IDs, comma-separated).
4. Run A8 (two guests going for the same rooms) on staging too.
5. **Expected:** one guest succeeds, and the other gets the "isn't available"
   message with nothing half-reserved.
6. **Reservation from H3:** `adults: 2`, `children: 1`, `pets: 1` and
   `guestCount: 3`. The room it booked has `petFriendly: true`.
7. Book 2 rooms of one type **without pets** while that type has both
   pet-friendly and other rooms free.
8. **Expected:** neither booked room is `petFriendly`. Pet-friendly rooms
   are kept for guests with pets.
9. **Webhook:** after any payment, Stripe dashboard → Webhooks → the
   endpoint's deliveries.
10. **Expected:** `payment_intent.succeeded` was delivered with **200**
    (response `booked` or `already-booked`). Sending a request to the
    endpoint without Stripe's signature gets **400**.
11. **Holds:** new reservations have `createdAt` and `holdExpiresAt`
    (1 hour later).
12. **Expected:**
    - After deploying, old unpaid reservations are cancelled with
      `cancellationReason: "expired"` the first time the site is used, and
      no emails are sent for them.
    - Calling the clean-up endpoint without `Authorization: Bearer
      <CRON_SECRET>` gets **401**.
13. **Refunds:** run K6 on staging (with `RESERVATION_HOLD_MINUTES=2` set on
    staging).
14. **Expected:**
    - The Stripe dashboard shows the payment **refunded in full**, once.
    - The reservation has a `refunds` entry with that refund's ID.
