import Link from 'next/link';
import Container from './Container';
import Image from 'next/image';

const Footer = () => {
  return (
    <>
      <div className="mt-16 p-2 bg-neutral-200 border-t-2 border-t-primary text-center uppercase">
        <Container>
          Enjoy great discounts with your stay! Get 5% off for over 10 days,
          7.5% off for over 20 days, and up to 10% off for 30 days or more!
        </Container>
      </div>
      <footer className="bg-alternate py-6 text-black border-t-4 border-t-black text-lg">
        <Container>
          <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Link href="/">
                <Image
                  src="/bhh-logo.jpg"
                  alt="Company Logo"
                  className="object-contain"
                  width={80}
                  height={50}
                  priority
                />
              </Link>
              <div className="text-lg">
                We kaboom your beauty holiday instantly and memorable.
              </div>
            </div>
            <div>
              <div>Phone number: 4371987611</div>
              <div>Email: sample@beverlyhill.ca</div>
              <div>Address: 123, Hotel Ave Toronto,ON M1A 2B3</div>
            </div>
          </div>
          <hr />
          <div className="text-center text-xs mt-10 mb-5">
            &copy; {new Date().getFullYear()} Copyright Beverly Hills Hotel. All
            Rights Reserved.
          </div>
        </Container>
      </footer>
    </>
  );
};

export default Footer;
