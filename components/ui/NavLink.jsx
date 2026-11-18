'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigation link that marks the current section (aria-current="page").
 * "/rooms" is also active on "/rooms/king-room", etc.
 */
const NavLink = ({
  href,
  children,
  mobile = false,
  className = '',
  ...props
}) => {
  const pathname = usePathname();
  const isActive =
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname?.startsWith(`${href}/`);

  const styles = mobile
    ? `flex w-full items-center rounded-lg px-4 py-3 text-base font-medium ${
        isActive
          ? 'bg-gold-50 text-ink-900 ring-1 ring-inset ring-gold-200'
          : 'text-ink-800 hover:bg-ink-50'
      }`
    : `relative inline-flex min-h-11 items-center rounded-lg px-3.5 text-[0.9375rem] font-medium transition-colors after:absolute after:inset-x-3.5 after:bottom-1.5 after:h-0.5 after:rounded-full after:transition-colors ${
        isActive
          ? 'text-ink-900 after:bg-gold-500'
          : 'text-ink-700 after:bg-transparent hover:text-ink-900 hover:after:bg-ink-200'
      }`;

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`${styles} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
};

export default NavLink;
