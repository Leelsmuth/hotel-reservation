import Link from 'next/link';
import Icon from './Icon';

/** <h2> + optional eyebrow, description and "see all" link for page sections. */
const SectionHeading = ({
  id,
  eyebrow,
  title,
  description,
  link,
  align = 'left',
  className = '',
}) => {
  const centered = align === 'center';
  return (
    <div
      className={`mb-8 flex flex-col gap-4 ${
        centered
          ? 'items-center text-center'
          : 'sm:flex-row sm:items-end sm:justify-between'
      } ${className}`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2
          id={id}
          className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-base text-ink-600">{description}</p>
        )}
      </div>
      {link && (
        <Link
          href={link.href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded text-sm font-semibold text-gold-700 hover:text-ink-900"
        >
          {link.label}
          <Icon
            name="arrow-right"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
};

export default SectionHeading;
