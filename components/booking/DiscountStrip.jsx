'use client';

import Link from 'next/link';
import Icon from '../ui/Icon';
import { useDiscountTiers } from './DiscountTiers';

/** Slim site-wide reminder of the long-stay discounts (above the footer). */
const DiscountStrip = () => {
  const { tiers, loaded } = useDiscountTiers();
  if (!loaded || tiers.length === 0) return null;

  return (
    <div className="border-t border-gold-200 bg-gold-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-2 px-4 py-4 text-center text-sm text-ink-800 sm:flex-row sm:gap-3 sm:px-6 lg:px-8">
        <span className="flex items-center gap-2 font-semibold text-ink-900">
          <Icon name="tag" className="h-5 w-5 text-gold-700" />
          Stay longer, save more:
        </span>
        <span>
          {tiers.map((tier, index) => (
            <span key={tier.short} className="inline-block whitespace-nowrap">
              {index > 0 && (
                <span aria-hidden="true" className="mx-2 text-gold-600">
                  ·
                </span>
              )}
              <strong className="font-semibold">{tier.value}% off</strong>{' '}
              {tier.short}
            </span>
          ))}
        </span>
        <Link href="/rooms#pricing" className="link whitespace-nowrap">
          How pricing works
        </Link>
      </div>
    </div>
  );
};

export default DiscountStrip;
