import Icon from './Icon';

/**
 * Inline message box for page-level feedback (errors, warnings, notices).
 * Errors are announced immediately (role="alert"); other tones politely.
 *
 *   <Alert tone="warning" title="Held for 1 hour">Pay to confirm…</Alert>
 */
const TONES = {
  info: {
    box: 'border-sky-200 bg-sky-50 text-sky-900',
    icon: 'info',
    iconColor: 'text-sky-700',
  },
  success: {
    box: 'border-green-200 bg-green-50 text-green-900',
    icon: 'check-circle',
    iconColor: 'text-green-700',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'warning',
    iconColor: 'text-amber-700',
  },
  error: {
    box: 'border-red-200 bg-red-50 text-red-900',
    icon: 'error',
    iconColor: 'text-red-700',
  },
  neutral: {
    box: 'border-ink-200 bg-ink-50 text-ink-800',
    icon: 'info',
    iconColor: 'text-ink-600',
  },
  gold: {
    box: 'border-gold-200 bg-gold-50 text-ink-900',
    icon: 'info',
    iconColor: 'text-gold-700',
  },
};

const Alert = ({
  tone = 'info',
  title,
  children,
  icon,
  action,
  className = '',
  role,
}) => {
  const style = TONES[tone] ?? TONES.info;

  return (
    <div
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${style.box} ${className}`}
    >
      <Icon
        name={icon ?? style.icon}
        className={`mt-0.5 h-5 w-5 ${style.iconColor}`}
      />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
};

export default Alert;
