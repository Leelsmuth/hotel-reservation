import Image from 'next/image';
import Link from 'next/link';
import StyledLink from '../ui/StyledLink';
import Container from './Container';

const Header = () => {
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
          <div className="flex gap-6">
            <StyledLink linkText="Make Reservation" path="/make-reservation" />
            <button type="button">My Account</button>
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
