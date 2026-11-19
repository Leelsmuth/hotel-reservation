import {
  day,
  expect,
  freeRooms,
  lookUpBooking,
  payByCard,
  reserveByApi,
  test,
} from './helpers';

/** Ends the hold now (mock mode), as if the hour had passed. */
const expireHold = async (request, bookingId) => {
  const response = await request.post('/api/mock/holds/expire', {
    data: { bookingId },
  });
  expect(response.ok()).toBe(true);
};
const bookingStatus = async (request, reservationId) =>
  await (await request.get(`/api/rooms/booking?id=${reservationId}`)).json();

test('an expired demo reservation on Manage booking', async ({ page }) => {
  await lookUpBooking(page, 'AZGUESTEXP1', 'eve.expired@example.com');
  await expect(page.getByText('This reservation expired')).toBeVisible();
  await expect(page.getByText('Cancelled · expired')).toBeVisible();
  await expect(page.getByText("It wasn't paid within 1 hour")).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book again' })).toBeVisible();
});

test('opening the payment page after the hold ran out', async ({
  page,
  request,
}) => {
  const booking = await reserveByApi(request, [
    { typeId: 'sSuite', adults: 1 },
  ]);
  await expireHold(request, booking.bookingId);
  await page.goto(
    `/booking?resId=${booking.reservationId}&bId=${booking.bookingId}`
  );
  await expect(page.getByText('This reservation has expired')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book again' })).toBeVisible();
  await expect(page.locator('#mock-card-number')).toHaveCount(0);
});

test('paying late while the rooms are still free: booked anyway', async ({
  page,
  request,
}) => {
  const booking = await reserveByApi(request, [
    { typeId: 'pSuite', adults: 2 },
  ]);
  await page.goto(
    `/booking?resId=${booking.reservationId}&bId=${booking.bookingId}`
  );
  await expect(page.getByRole('button', { name: /Pay \$/ })).toBeVisible();
  await expireHold(request, booking.bookingId);

  await payByCard(page, '$339.00');
  await expect(
    page.getByRole('heading', { name: 'Your booking is confirmed' })
  ).toBeVisible();
  expect(
    (await bookingStatus(request, booking.reservationId)).bookingStatus
  ).toBe('booked');
});

test('paying late after someone else took the rooms: refunded, clearly explained', async ({
  page,
  request,
}) => {
  const from = day(700);
  const to = day(701);
  const booking = await reserveByApi(
    request,
    [{ typeId: 'eSuite', adults: 2 }],
    { from, to }
  );
  await page.goto(
    `/booking?resId=${booking.reservationId}&bId=${booking.bookingId}`
  );
  await expect(page.getByRole('button', { name: /Pay \$/ })).toBeVisible();

  await expireHold(request, booking.bookingId);
  const suites = (await freeRooms(request, from, to)).eSuite;
  await reserveByApi(
    request,
    Array(suites).fill({ typeId: 'eSuite', adults: 1 }),
    { from, to, email: 'other@example.com' }
  );

  await payByCard(page, '$395.50');
  await expect(
    page.getByText("We've refunded your payment", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText('expired before your payment went through')
  ).toBeVisible();
  await expect(page.getByText("Please don't pay again")).toHaveCount(0);
  const room = await bookingStatus(request, booking.reservationId);
  expect(room.refunds).toHaveLength(1);
});

test('the guest closes the tab right after paying: the webhook books it', async ({
  page,
  request,
}) => {
  const booking = await reserveByApi(request, [
    { typeId: 'dStandard', adults: 2 },
    { typeId: 'sSuite', adults: 1, pets: 1 },
  ]);
  const completions = [];
  page.on(
    'request',
    (r) => r.method() === 'PATCH' && completions.push(r.url())
  );

  await page.goto(
    `/booking?resId=${booking.reservationId}&bId=${booking.bookingId}`
  );
  await page
    .getByRole('button', { name: 'Mock: pay, then close the tab' })
    .click();
  await expect(page.getByText('payment sent, tab')).toBeVisible();

  await expect
    .poll(async () =>
      (
        await bookingStatus(request, booking.reservationId)
      ).groupReservations.map((r) => r.bookingStatus)
    )
    .toEqual(['booked', 'booked']);
  expect(completions).toEqual([]); // the page never reported it
});
