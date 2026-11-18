import Link from 'next/link';
import Container from '../layout/Container';
import Icon from './Icon';

/**
 * Top of every interior page: optional breadcrumbs, eyebrow, the page's
 * <h1>, a short description and optional actions. Keeps titles the same
 * size and position on every page.
 */
const PageHeader = ({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  children,
  align = 'left',
}) => {
  const centered = align === 'center';

  return (
    <div className="border-b border-sand-200 bg-sand-50">
      <Container classes={`py-10 sm:py-12 ${centered ? 'text-center' : ''}`}>
        {breadcrumbs && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol
              className={`flex flex-wrap items-center gap-1.5 text-sm text-ink-600 ${
                centered ? 'justify-center' : ''
              }`}
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="rounded hover:text-ink-900 hover:underline"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? 'page' : undefined}
                        className={isLast ? 'font-medium text-ink-900' : ''}
                      >
                        {crumb.label}
                      </span>
                    )}
                    {!isLast && (
                      <Icon
                        name="chevron-right"
                        className="h-3.5 w-3.5 text-ink-400"
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <div
          className={`flex flex-col gap-6 ${
            centered
              ? 'items-center'
              : 'md:flex-row md:items-end md:justify-between'
          }`}
        >
          <div className={centered ? 'mx-auto max-w-2xl' : 'max-w-3xl'}>
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-3 text-base text-ink-600 sm:text-lg">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
          )}
        </div>
        {children}
      </Container>
    </div>
  );
};

export default PageHeader;
