'use client';

import { useBooking } from '@/context/BookingContext';

/**
 * The length-of-stay discounts, from the live discount settings. Matches
 * discountForNights(): 11+ nights, 21+ nights, 30+ nights.
 */
export const useDiscountTiers = () => {
  const { discounts, discountsLoaded } = useBooking();
  const tiers = [
    { nights: '11–20 nights', short: '11+ nights', value: discounts?.ELEVEN },
    {
      nights: '21–29 nights',
      short: '21+ nights',
      value: discounts?.TWENTYONE,
    },
    { nights: '30+ nights', short: '30+ nights', value: discounts?.THIRTYPLUS },
  ].filter((tier) => Number(tier.value) > 0);
  return { tiers, loaded: discountsLoaded };
};

const DiscountTiers = ({ variant = 'cards', className = '' }) => {
  const { tiers, loaded } = useDiscountTiers();

  if (!loaded) {
    return (
      <div
        className={`h-20 animate-pulse rounded-xl bg-ink-100 ${className}`}
        aria-hidden="true"
      />
    );
  }
  if (tiers.length === 0) return null;

  if (variant === 'list') {
    return (
      <ul className={`space-y-2 text-sm ${className}`}>
        {tiers.map((tier) => (
          <li
            key={tier.nights}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-ink-700">{tier.nights}</span>
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-200">
              {tier.value}% off
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${className}`}>
      {tiers.map((tier) => (
        <li
          key={tier.nights}
          className="rounded-2xl border border-gold-200 bg-white p-5 text-center shadow-card"
        >
          <p className="font-display text-4xl font-semibold text-ink-900">
            {tier.value}%
            <span className="ml-1 align-middle font-sans text-base font-semibold text-ink-600">
              off
            </span>
          </p>
          <p className="mt-1 text-sm font-medium text-ink-700">
            Stays of {tier.nights}
          </p>
        </li>
      ))}
    </ul>
  );
};

export default DiscountTiers;
