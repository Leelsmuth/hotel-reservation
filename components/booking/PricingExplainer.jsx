import { TAX_PERCENTAGE } from '@/lib/pricing/bookingPrice';
import {
  MAX_ADULTS_PER_ROOM,
  MAX_GUESTS_PER_ROOM,
  MAX_PETS_PER_ROOM,
} from '@/lib/booking/occupancy';
import Icon from '../ui/Icon';
import DiscountTiers from './DiscountTiers';

/**
 * Compact "how pricing works" card for sidebars (search results, room
 * pages): nightly rate, taxes, long-stay discounts and the 1-hour hold.
 */
const PricingExplainer = ({ className = '', title = 'How pricing works' }) => (
  <section
    aria-labelledby="pricing-explainer-title"
    className={`card p-5 ${className}`}
  >
    <h2
      id="pricing-explainer-title"
      className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900"
    >
      <Icon name="tag" className="h-5 w-5 text-gold-700" />
      {title}
    </h2>
    <ul className="mt-4 space-y-3 text-sm text-ink-700">
      <li className="flex gap-2.5">
        <Icon
          name="check"
          className="mt-0.5 h-4 w-4 text-gold-700"
          strokeWidth={2}
        />
        <span>
          Prices are per room, per night, for up to {MAX_ADULTS_PER_ROOM} adults
          ({MAX_GUESTS_PER_ROOM} guests with children).
        </span>
      </li>
      <li className="flex gap-2.5">
        <Icon name="paw" className="mt-0.5 h-4 w-4 text-gold-700" />
        <span>
          Pets stay free in pet-friendly rooms, up to {MAX_PETS_PER_ROOM} per
          room.
        </span>
      </li>
      <li className="flex gap-2.5">
        <Icon
          name="check"
          className="mt-0.5 h-4 w-4 text-gold-700"
          strokeWidth={2}
        />
        <span>{TAX_PERCENTAGE}% tax is added to the total. No other fees.</span>
      </li>
      <li className="flex gap-2.5">
        <Icon
          name="check"
          className="mt-0.5 h-4 w-4 text-gold-700"
          strokeWidth={2}
        />
        <span>Long stays are discounted automatically:</span>
      </li>
    </ul>
    <DiscountTiers variant="list" className="mt-3 rounded-xl bg-sand-50 p-3" />
    <p className="mt-4 flex gap-2.5 border-t border-ink-100 pt-4 text-sm text-ink-700">
      <Icon name="clock" className="mt-0.5 h-4 w-4 text-gold-700" />
      <span>
        Reserving is free: we hold the room for 1 hour while you pay to confirm.
      </span>
    </p>
  </section>
);

export default PricingExplainer;
