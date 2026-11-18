'use client';

import withAuth from '@/components/hoc/withAuth';
import Container from '@/components/layout/Container';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/ui/PageHeader';
import Icon from '@/components/ui/Icon';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const ACCOUNT_NAV = [
  { href: '/profile', label: 'Overview', icon: 'home' },
  { href: '/profile/reservations', label: 'Awaiting payment', icon: 'clock' },
  { href: '/profile/bookings', label: 'Confirmed bookings', icon: 'calendar' },
  { href: '/profile/change-password', label: 'Password', icon: 'key' },
];

const AccountNavLink = ({ href, icon, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-ink-900 text-white'
          : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900'
      }`}
    >
      <Icon
        name={icon}
        className={`h-5 w-5 ${isActive ? 'text-gold-300' : 'text-ink-500'}`}
      />
      {children}
    </Link>
  );
};

const PageLayout = ({ children }) => {
  const { userData, logout } = useAuth();
  const router = useRouter();
  const firstName = userData?.fullName?.split(' ')[0];

  return (
    <MainLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'My account' }]}
        eyebrow="My account"
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Pay for reservations, view your confirmed bookings and manage your account."
      />
      <Container classes="py-10 sm:py-12 lg:pb-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <nav
            aria-label="Account"
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
              {ACCOUNT_NAV.map((item) => (
                <li key={item.href}>
                  <AccountNavLink href={item.href} icon={item.icon}>
                    {item.label}
                  </AccountNavLink>
                </li>
              ))}
              <li className="lg:mt-4 lg:border-t lg:border-ink-100 lg:pt-4">
                <button
                  type="button"
                  className="flex min-h-11 w-full shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3.5 text-left text-sm font-medium text-ink-700 hover:bg-ink-100 hover:text-ink-900"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                >
                  <Icon name="logout" className="h-5 w-5 text-ink-500" />
                  Log out
                </button>
              </li>
            </ul>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </MainLayout>
  );
};

export default withAuth(PageLayout);
