import Icon from '../ui/Icon';

/** How reserving, paying and cancelling work, in plain words. */
export const POLICIES = [
  {
    icon: 'clock',
    title: 'Reserve now, pay within 1 hour',
    text: 'Reserving is free. We hold your room for 1 hour; after that it is released if unpaid.',
  },
  {
    icon: 'credit-card',
    title: 'Pay online to confirm',
    text: 'Your booking is confirmed once payment goes through. A card is required at booking.',
  },
  {
    icon: 'receipt',
    title: 'Cancellation',
    text: 'Unpaid reservations can be cancelled free of charge. Cancelling a paid booking costs 30% of the total; 70% is refunded.',
  },
];

const BookingPolicies = ({ className = '', compact = false }) => (
  <ul className={`space-y-4 ${className}`}>
    {POLICIES.map((policy) => (
      <li key={policy.title} className="flex gap-3">
        <span
          className={`flex shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200 ${
            compact ? 'h-8 w-8' : 'h-10 w-10'
          }`}
        >
          <Icon
            name={policy.icon}
            className={compact ? 'h-4 w-4' : 'h-5 w-5'}
          />
        </span>
        <div className="text-sm">
          <p className="font-semibold text-ink-900">{policy.title}</p>
          <p className="mt-0.5 text-ink-600">{policy.text}</p>
        </div>
      </li>
    ))}
  </ul>
);

export default BookingPolicies;
