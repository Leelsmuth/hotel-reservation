'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavLink = ({ href, children, ...props }) => {
  const pathname = usePathname();

  const isActive = pathname === href;

  return (
    <Link
      href={href}
      {...props}
      className={`${
        isActive ? 'underline' : ''
      } hover:underline py-3 lg:py-0 px-5 lg:px-0`}
    >
      {children}
    </Link>
  );
};

export default NavLink;
