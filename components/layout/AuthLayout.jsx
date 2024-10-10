import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';

const AuthLayout = ({ children }) => {
  return (
    <Fragment>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-svh">
        <div className="bg-[url('/exterior.jpg')] bg-cover p-10 flex justify-center items-center order-1 lg:order-0">
          <Link href="/">
            <Image
              src="/bhh-logo.jpg"
              width={300}
              height={280}
              className="object-contain"
              alt="BHH Logo"
            />
          </Link>
        </div>
        <main className="text-lg order-0 lg:order-1 p-5">{children}</main>
      </div>
    </Fragment>
  );
};

export default AuthLayout;
