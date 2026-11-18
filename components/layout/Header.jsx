'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Container from './Container';
import { useAuth } from '@/context/AuthProvider';
import NavLink from '../ui/NavLink';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { getFocusable, trapTabKey } from '@/lib/helpers/focus';

export const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/manage-reservation', label: 'Manage booking' },
  { href: '/about', label: 'About' },
];

export const BrandMark = ({ onDark = false, size = 'md' }) => (
  <span className="flex items-center gap-3">
    <Image
      src="/bhh-logo.jpg"
      alt=""
      width={size === 'lg' ? 56 : 44}
      height={size === 'lg' ? 56 : 44}
      className={`rounded-md object-contain ${size === 'lg' ? 'h-14 w-14' : 'h-11 w-11'}`}
      priority
    />
    <span className="leading-none">
      <span
        className={`block font-display text-lg font-semibold tracking-tight sm:text-xl ${
          onDark ? 'text-white' : 'text-ink-900'
        }`}
      >
        Beverly Hills
      </span>
      <span
        className={`mt-1 block text-[0.6875rem] font-semibold uppercase tracking-[0.28em] ${
          onDark ? 'text-gold-300' : 'text-gold-700'
        }`}
      >
        Hotel · Toronto
      </span>
    </span>
  </span>
);

const AccountMenu = ({ name, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const firstName = name?.split(' ')[0] || 'Account';

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="account-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 rounded-lg border border-ink-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-400"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold uppercase text-gold-300">
          {firstName.charAt(0)}
        </span>
        <span className="max-w-[10rem] truncate">Hi, {firstName}</span>
        <Icon
          name="chevron-down"
          className={`h-4 w-4 text-ink-600 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          id="account-menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-ink-100 bg-white py-1.5 shadow-popover"
        >
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-800 hover:bg-ink-50"
          >
            <Icon name="user" className="h-4 w-4 text-ink-600" />
            My account
          </Link>
          <Link
            href="/profile/bookings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-800 hover:bg-ink-50"
          >
            <Icon name="calendar" className="h-4 w-4 text-ink-600" />
            My bookings
          </Link>
          <div className="my-1.5 border-t border-ink-100" />
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-ink-50"
          >
            <Icon name="logout" className="h-4 w-4 text-ink-600" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user, userData, initializing } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const handleSignOut = () => {
    logout();
    setShowMenu(false);
    router.push('/login');
  };

  // Close the mobile menu on navigation
  useEffect(() => {
    setShowMenu(false);
  }, [pathname]);

  // Mobile menu: Escape closes, focus moves in, page doesn't scroll behind
  useEffect(() => {
    if (!showMenu) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    getFocusable(drawerRef.current)[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
        menuButtonRef.current?.focus();
        return;
      }
      // Keep Tab inside the open menu
      trapTabKey(event, drawerRef.current);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showMenu]);

  const signedIn = !initializing && user && userData;

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <Container>
        <div className="flex h-[4.5rem] items-center justify-between gap-6">
          <Link href="/" className="rounded-md">
            <BrandMark />
            <span className="sr-only">: home</span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {initializing ? (
              // Who is signed in isn't known yet: keep the space without
              // flashing "Log in" at a signed-in user
              <span aria-hidden="true" className="h-11 w-24" />
            ) : signedIn ? (
              <AccountMenu
                name={userData?.fullName}
                onSignOut={handleSignOut}
              />
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-100"
              >
                Log in
              </Link>
            )}
            <Button href="/make-reservation" size="md">
              Book a room
            </Button>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-lg border border-ink-200 px-3 text-sm font-semibold text-ink-900 lg:hidden"
            aria-expanded={showMenu}
            aria-controls="mobile-menu"
            onClick={() => setShowMenu(true)}
          >
            <Icon name="menu" className="h-5 w-5" />
            Menu
          </button>
        </div>
      </Container>

      {/* Mobile drawer. Portalled to <body>: the header's backdrop-filter
          would otherwise trap this fixed-position panel inside the header. */}
      {showMenu &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 animate-fade-in bg-ink-900/50"
              aria-hidden="true"
              onClick={() => setShowMenu(false)}
            />
            <div
              id="mobile-menu"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-slide-in-right flex-col bg-white shadow-popover"
            >
              <div className="flex h-[4.5rem] items-center justify-between border-b border-ink-100 px-4">
                <BrandMark />
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    menuButtonRef.current?.focus();
                  }}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
                  aria-label="Close menu"
                >
                  <Icon name="x" className="h-6 w-6" />
                </button>
              </div>
              <nav
                aria-label="Main"
                className="flex-1 overflow-y-auto px-2 py-4"
              >
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.href}>
                      <NavLink href={item.href} mobile>
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                {signedIn && (
                  <>
                    <p className="mt-6 px-4 text-xs font-semibold uppercase tracking-wider text-ink-600">
                      Signed in as {userData?.fullName}
                    </p>
                    <ul className="mt-2 space-y-1">
                      <li>
                        <NavLink href="/profile" mobile>
                          My account
                        </NavLink>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full items-center rounded-lg px-4 py-3 text-left text-base font-medium text-ink-800 hover:bg-ink-50"
                        >
                          Sign out
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </nav>
              <div className="space-y-3 border-t border-ink-100 p-4">
                <Button href="/make-reservation" fullWidth size="lg">
                  Book a room
                </Button>
                {!initializing && !signedIn && (
                  <Button href="/login" variant="secondary" fullWidth size="lg">
                    Log in
                  </Button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};

export default Header;
