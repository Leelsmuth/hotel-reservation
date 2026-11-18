import { TAX_PERCENTAGE } from '@/lib/pricing/bookingPrice';
import { formatPrice, pluralize } from '@/lib/helpers/formatters';

/**
 * Itemised price: nightly rate × nights, long-stay discount, tax, total.
 * Pass the figures from the server (reservation) or from
 * calculateBookingPrice() for an estimate.
 */
const PriceBreakdown = ({
  roomPrice,
  nights,
  discount = 0,
  discountAmount = 0,
  tax,
  total,
  totalLabel = 'Total (CAD)',
  className = '',
}) => {
  const nightsCount = Number(nights) || 0;
  const base = Number(roomPrice) * nightsCount;

  return (
    <dl className={`space-y-2.5 text-sm ${className}`}>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-600">
          {formatPrice(roomPrice)} × {pluralize(nightsCount, 'night')}
        </dt>
        <dd className="tabular-nums text-ink-900">{formatPrice(base)}</dd>
      </div>
      {Number(discountAmount) > 0 && (
        <div className="flex justify-between gap-4">
          <dt className="text-green-800">
            Long-stay discount{discount ? ` (${discount}%)` : ''}
          </dt>
          <dd className="tabular-nums font-medium text-green-800">
            −{formatPrice(discountAmount)}
          </dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-ink-600">Taxes ({TAX_PERCENTAGE}%)</dt>
        <dd className="tabular-nums text-ink-900">{formatPrice(tax)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-ink-200 pt-3">
        <dt className="font-semibold text-ink-900">{totalLabel}</dt>
        <dd className="text-lg font-semibold tabular-nums text-ink-900">
          {formatPrice(total)}
        </dd>
      </div>
    </dl>
  );
};

export default PriceBreakdown;
