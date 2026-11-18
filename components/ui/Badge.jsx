/**
 * Small status pill, e.g. reservation status or "Sold out".
 * Text colours are the 700/800 shades so they pass AA on their tints.
 */
const TONES = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  gold: 'bg-gold-50 text-gold-800 ring-gold-200',
  success: 'bg-green-50 text-green-800 ring-green-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  danger: 'bg-red-50 text-red-800 ring-red-200',
  info: 'bg-sky-50 text-sky-900 ring-sky-200',
  dark: 'bg-ink-900/85 text-white ring-white/10 backdrop-blur-sm',
};

const Badge = ({ tone = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
      TONES[tone] ?? TONES.neutral
    } ${className}`}
  >
    {children}
  </span>
);

export default Badge;
