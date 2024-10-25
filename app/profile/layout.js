'use client';

import withAuth from '@/components/hoc/withAuth';
import Container from '@/components/layout/Container';
import MainLayout from '@/components/layout/MainLayout';
import HeadingOne from '@/components/typography/HeadingOne';
import HeadingTwo from '@/components/typography/HeadingTwo';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NavLink = ({ href, children, ...props }) => {
  const pathname = usePathname();

  const isActive = pathname === href;

  return (
    <Link
      href={href}
      {...props}
      className={`${
        isActive ? 'bg-alternate' : ''
      } hover:bg-alternate/30 py-3 inline-block w-full px-3 sm:px-5 mb-3`}
    >
      {children}
    </Link>
  );
};

const PageLayout = ({ children }) => {
  const { userData, logout } = useAuth();
  const router = useRouter();

  return (
    <MainLayout>
      <Container>
        <div className="flex flex-col sm:flex-row gap-6 mt-10">
          <ul className="sm:w-[250px] grid grid-cols-2 sm:grid-cols-1 *:text-sm *:sm:text-lg">
            <li>
              <NavLink href="/profile">Dashboard</NavLink>
            </li>
            <li>
              <NavLink href="/profile/reservations">
                Active Reservations
              </NavLink>
            </li>
            <li>
              <NavLink href="/profile/bookings">Active Bookings</NavLink>
            </li>
            <li>
              <NavLink href="/profile/change-password">Change Password</NavLink>
            </li>
            <li>
              <button
                type="button"
                className="hover:bg-alternate/30 py-3 inline-block w-full px-5 mb-3 text-left"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
              >
                Logout
              </button>
            </li>
          </ul>
          <div className="flex-1">
            <div className="text-center mb-6">
              <HeadingOne>Account</HeadingOne>
              <HeadingTwo>Welcome, {userData.fullName}</HeadingTwo>
            </div>
            <div>{children}</div>
          </div>
        </div>
      </Container>
    </MainLayout>
  );
};

export default withAuth(PageLayout);
