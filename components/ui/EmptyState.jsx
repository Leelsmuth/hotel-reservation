import Icon from './Icon';

/** Friendly "nothing here yet" block with an optional next step. */
const EmptyState = ({
  icon = 'calendar',
  title,
  children,
  action,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center rounded-2xl border border-dashed border-ink-300 bg-sand-50 px-6 py-12 text-center ${className}`}
  >
    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gold-700 shadow-card">
      <Icon name={icon} className="h-6 w-6" />
    </span>
    <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
    {children && <div className="mt-2 max-w-md text-ink-600">{children}</div>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export default EmptyState;
