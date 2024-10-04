'use client';

import Image from 'next/image';
import Link from 'next/link';
import StyledLink from '../ui/StyledLink';
import Container from './Container';
import { useAuth } from '@/context/AuthProvider';
import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <header>
      <Container>
        <div className="flex justify-between items-center">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Company Logo"
              className="object-contain"
              width={130}
              height={80}
              priority
            />
          </Link>
          <div className="flex gap-6 items-center">
            <StyledLink linkText="Make Reservation" path="/make-reservation" />
            <div className="relative">
              <button
                type="button"
                className="px-4 py-2"
                onClick={() => setShowAccountDropDown(!showAccountDropDown)}
              >
                {user ? `Hi ${userData.fullName}` : 'My Account'}
              </button>
              {showAccountDropDown && (
                <div className="absolute px-4">
                  {user ? (
                    <Fragment>
                      <div>
                        <Link
                          href="/account"
                          onClick={() => setShowAccountDropDown(false)}
                        >
                          Profile
                        </Link>
                        <button type="button" onClick={handleSignOut}>
                          Log Out
                        </button>
                      </div>
                    </Fragment>
                  ) : (
                    <Fragment>
                      <Link
                        href="/login"
                        onClick={() => setShowAccountDropDown(false)}
                        className="block"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setShowAccountDropDown(false)}
                        className="block"
                      >
                        Sign up
                      </Link>
                    </Fragment>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className="flex justify-evenly gap-16">
          <Link href="/manage-reservation">Reservations</Link>
          <Link href="/rooms">Rooms</Link>
          <Link href="/special-offers">Special Offers</Link>
          <Link href="/contact-us">Contact Us</Link>
        </nav>
      </Container>
    </header>
  );
};

export default Header;
