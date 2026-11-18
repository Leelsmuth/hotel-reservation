import { format, isValid, parseISO } from 'date-fns';

const currency = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  currencyDisplay: 'narrowSymbol',
});

const wholeCurrency = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

/** 169.5 -> "$169.50". Whole nightly rates can drop the cents: 150 -> "$150". */
export const formatPrice = (amount, { whole = false } = {}) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  return whole && Number.isInteger(value)
    ? wholeCurrency.format(value)
    : currency.format(value);
};

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(String(value));
  return isValid(date) ? date : null;
};

/** "2026-11-18" or a Date -> "Wed, 18 Nov 2026" */
export const formatStayDate = (value, pattern = 'EEE, d MMM yyyy') => {
  const date = toDate(value);
  return date ? format(date, pattern) : '—';
};

/** "Wed 18 Nov – Thu 19 Nov 2026" */
export const formatStayRange = (from, until) => {
  const start = toDate(from);
  const end = toDate(until);
  if (!start || !end) return '—';
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${format(start, sameYear ? 'EEE d MMM' : 'EEE d MMM yyyy')} – ${format(
    end,
    'EEE d MMM yyyy'
  )}`;
};

export const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${Number(count) === 1 ? singular : plural}`;
