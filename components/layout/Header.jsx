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

  const handleSignOut = () => {
    logout();
    setShowAccountDropDown(false);
    router.push('/login');
  };

  return (
    <header className="py-2 border-4 border-b-black mb-4">
      <Container>
        <div className="flex justify-between items-center font-medium font-[family-name:var(--font-geist-sans)] text-lg">
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
          <nav className="flex items-center gap-16">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/rooms">Rooms</NavLink>
            <NavLink href="/manage-reservation">Reservations</NavLink>
            <NavLink href="/about">About</NavLink>
            <Link
              href="/login"
              className="px-8 py-2 bg-alternate text-black hover:bg-black hover:text-alternate transition-colors hover:rounded-md"
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
