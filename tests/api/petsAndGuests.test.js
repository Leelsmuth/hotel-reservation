import { describe, expect, test } from 'vitest';
import { availability, day, getBooking, reserve } from '../support/booking';

const PET_KINGS = [3400, 3500];

describe('pet-friendly rooms', () => {
  test('availability says how many pet-friendly rooms are free', async () => {
    expect((await availability()).petFriendlyCounts).toEqual({
      eSuite: 0,
      pSuite: 1,
      dStandard: 2,
      sSuite: 2,
    });
  });

  test('none free today+30 to today+33 (demo data)', async () => {
    const { petFriendlyCounts } = await availability(day(30), 3);
    expect(Object.values(petFriendlyCounts).every((n) => n === 0)).toBe(true);
    const { status, body } = await reserve(
      [{ typeId: 'dStandard', adults: 2, pets: 1 }],
      {
        from: day(30),
        nights: 3,
      }
    );
    expect(status).toBe(409);
    expect(body.error).toBe(
      'No pet-friendly King Room is available for these dates.'
    );
  });

  test('pets get a pet-friendly room; rooms without pets get the others', async () => {
    const { body } = await reserve([
      { typeId: 'dStandard', adults: 2 },
      { typeId: 'dStandard', adults: 2, children: 2, pets: 2 },
      { typeId: 'dStandard', adults: 1 },
    ]);
    const [first, withPets, third] = (await getBooking(body.reservationId))
      .groupReservations;
    expect(PET_KINGS).toContain(withPets.roomNo);
    expect(PET_KINGS).not.toContain(first.roomNo);
    expect(PET_KINGS).not.toContain(third.roomNo);
    expect(withPets).toMatchObject({
      adults: 2,
      children: 2,
      pets: 2,
      guestCount: 4,
    });
    // Pets aren't guests: 2 + 4 + 1
    expect(first.guestCountActual).toBe(7);
  });

  test('no pet fee', async () => {
    const withPet = await reserve([
      { typeId: 'dStandard', adults: 1, pets: 2 },
    ]);
    const without = await reserve([{ typeId: 'dStandard', adults: 1 }]);
    expect(withPet.body.pricing.totalPrice).toBe(
      without.body.pricing.totalPrice
    );
  });

  test('more pet rooms than are free: 409', async () => {
    await reserve([{ typeId: 'dStandard', adults: 1, pets: 1 }]);
    const { status, body } = await reserve([
      { typeId: 'dStandard', adults: 1, pets: 1 },
      { typeId: 'dStandard', adults: 1, pets: 1 },
    ]);
    expect(status).toBe(409);
    expect(body.error).toBe(
      'Only 1 pet-friendly King Room is available for these dates, not 2.'
    );
  });

  test('rooms without pets use a pet-friendly room when nothing else is free', async () => {
    const { dStandard } = (await availability()).availableCounts;
    const { status } = await reserve(
      Array(dStandard).fill({ typeId: 'dStandard', adults: 1 })
    );
    expect(status).toBe(200);
  });
});

describe('who can share a room (enforced by the API)', () => {
  test.each([
    [{ adults: 0, children: 2 }, /at least 1 adult/],
    [{ adults: 5 }, /up to 4 adults/],
    [{ adults: 4, children: 3 }, /up to 6 guests, children included/],
    [{ adults: 2, pets: 3 }, /up to 2 pets/],
    [{ adults: 2, children: -1 }, /0 or more/],
  ])('%o -> 400', async (people, message) => {
    const { status, body } = await reserve([{ typeId: 'sSuite', ...people }]);
    expect(status).toBe(400);
    expect(body.error).toMatch(message);
  });

  test.each([
    [{ adults: 4, children: 2, pets: 2 }],
    [{ adults: 1, children: 5 }],
  ])('%o fits in one room', async (people) => {
    expect((await reserve([{ typeId: 'sSuite', ...people }])).status).toBe(200);
  });
});
