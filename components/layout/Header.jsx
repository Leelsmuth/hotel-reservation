'use client';

import Image from 'next/image';
import Link from 'next/link';
import StyledLink from '../ui/StyledLink';
import Container from './Container';
import { useAuth } from '@/context/AuthProvider';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavLink from '../ui/NavLink';

const Header = () => {
  const router = useRouter();
  const { logout, user, userData } = useAuth();
  const [showAccountDropDown, setShowAccountDropDown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = () => {
    logout();
    setShowAccountDropDown(false);
    router.push('/login');
  };

  return (
    <header className="py-2 border-b-4 border-b-black">
      <Container>
        <div className="flex justify-between gap-16 items-center font-medium font-[family-name:var(--font-geist-sans)] text-lg">
          <Link href="/">
            <Image
              src="/bhh-logo.jpg"
              alt="Company Logo"
              className="object-contain"
              width={130}
              height={80}
              priority
            />
          </Link>
          <button
            type="button"
            className="uppercase text-xl font-bold p-6 block lg:hidden"
            onClick={() => setShowMenu(!showMenu)}
          >
            Menu
          </button>
          <nav
            className={`flex flex-col lg:justify-end z-20 lg:flex-row fixed lg:static lg:opacity-100 top-0 w-full bg-white lg:bg-transparent max-w-96 lg:max-w-full transition-all duration-500 h-full pt-32 lg:pt-0 items-center gap-16 shadow-xl lg:shadow-none ${
              showMenu ? 'right-0 opacity-100' : '-right-full opacity-0'
            }`}
          >
            <button
              type="button"
              className="uppercase text-xl font-bold p-6 block lg:hidden absolute right-4 top-8"
              onClick={() => setShowMenu(false)}
            >
              Close
            </button>
            <NavLink href="/" onClick={() => setShowMenu(false)}>
              Home
            </NavLink>
            <NavLink href="/rooms" onClick={() => setShowMenu(false)}>
              Rooms
            </NavLink>
            <NavLink
              href="/manage-reservation"
              onClick={() => setShowMenu(false)}
            >
              Reservations
            </NavLink>
            <NavLink href="/about" onClick={() => setShowMenu(false)}>
              About
            </NavLink>
            <Link
              href="/login"
              className="px-8 py-2 bg-alternate text-black hover:bg-black hover:text-alternate transition-colors hover:rounded-md"
              onClick={() => setShowMenu(false)}
            >
              Login
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
};

export default Header;
