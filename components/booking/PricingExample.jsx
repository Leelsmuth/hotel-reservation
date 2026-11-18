'use client';

import { useBooking } from '@/context/BookingContext';
import {
  calculateBookingPrice,
  discountForNights,
} from '@/lib/pricing/bookingPrice';
import { getRoomByType } from '@/lib/static/roomCatalog';
import PriceBreakdown from './PriceBreakdown';

/**
 * A worked example using the real pricing function and the live discounts,
 * so it always matches what guests are charged.
 */
const PricingExample = ({ typeId = 'dStandard', nights = 12 }) => {
  const { discounts, discountsLoaded } = useBooking();
  const room = getRoomByType(typeId);
  if (!room) return null;

  const discount = discountsLoaded ? discountForNights(nights, discounts) : 0;
  const price = calculateBookingPrice({
    roomPrice: room.price,
    nights,
    discount,
  });

  return (
    <figure className="card p-5 sm:p-6">
      <figcaption className="mb-4">
        <p className="eyebrow">Example</p>
        <p className="mt-1 font-display text-lg font-semibold text-ink-900">
          {room.name}, {nights} nights
        </p>
      </figcaption>
      <PriceBreakdown
        roomPrice={price.roomPrice}
        nights={price.nightsCount}
        discount={price.discount}
        discountAmount={price.discountAmount}
        tax={price.tax}
        total={price.totalPrice}
      />
    </figure>
  );
};

export default PricingExample;
