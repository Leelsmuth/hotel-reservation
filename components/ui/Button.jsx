import Link from 'next/link';
import Spinner from '../anim/Spinner';
import Icon from './Icon';

/**
 * The one button style for the whole app. Renders a <Link> when `href` is
 * given, otherwise a <button>.
 *
 * Variants (all text/background pairs meet WCAG AA):
 *   primary    gold, for the main action on a screen (Reserve, Pay, Search)
 *   dark       ink, strong secondary action
 *   secondary  outlined, for alternatives (View details, Log in)
 *   ghost      no border, for low-emphasis actions (Back, Close)
 *   danger     filled red, for destructive confirmation in dialogs
 *   danger-outline  outlined red, to start a destructive flow (Cancel booking)
 *   light      outlined white, on photos and dark backgrounds
 */
const VARIANTS = {
  primary:
    'bg-gold-400 text-ink-900 border-gold-400 hover:bg-gold-500 hover:border-gold-500 active:bg-gold-600 active:border-gold-600',
  dark: 'bg-ink-900 text-white border-ink-900 hover:bg-ink-700 hover:border-ink-700',
  secondary:
    'bg-white text-ink-900 border-ink-400 hover:border-ink-900 hover:bg-ink-50',
  ghost: 'bg-transparent text-ink-800 border-transparent hover:bg-ink-100',
  danger:
    'bg-red-700 text-white border-red-700 hover:bg-red-800 hover:border-red-800',
  'danger-outline': 'bg-white text-red-700 border-red-700 hover:bg-red-50',
  light:
    'bg-white/10 text-white border-white/80 backdrop-blur-sm hover:bg-white hover:text-ink-900',
};

const SIZES = {
  sm: 'min-h-9 px-3.5 py-1.5 text-sm gap-1.5',
  md: 'min-h-11 px-5 py-2 text-[0.9375rem] gap-2',
  lg: 'min-h-12 px-6 py-2.5 text-base gap-2',
};

export const buttonClasses = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
} = {}) =>
  [
    'inline-flex items-center justify-center rounded-lg border font-semibold leading-tight text-center transition-colors duration-150',
    'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

const Button = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingText,
  icon,
  iconRight,
  className = '',
  type = 'button',
  disabled,
  ...rest
}) => {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const content = (
    <>
      {loading ? (
        <Spinner
          spinnerHeight={iconSize.split(' ')[0]}
          spinnerWidth={iconSize.split(' ')[1]}
          inline
        />
      ) : (
        icon && <Icon name={icon} className={iconSize} />
      )}
      <span>{loading && loadingText ? loadingText : children}</span>
      {iconRight && !loading && <Icon name={iconRight} className={iconSize} />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
};

export default Button;
