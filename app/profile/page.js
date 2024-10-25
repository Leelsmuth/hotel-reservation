'use client';

import withAuth from '@/components/hoc/withAuth';
import Link from 'next/link';

const Profile = () => {
  return (
    <div>
      <div className="flex flex-col items-center gap-4">
        <Link
          className="min-h-24 w-72 flex justify-center items-center shadow-md hover:shadow-2xl bg-teal-200 hover:bg-teal-500 rounded-s-xl"
          href="/profile/reservations"
        >
          Manage Reservations
        </Link>
        <Link
          className="min-h-24 w-72 flex justify-center items-center shadow-md hover:shadow-2xl bg-orange-200 hover:bg-orange-500 rounded-s-xl"
          href="/profile/bookings"
        >
          Manage Bookings
        </Link>
        <Link
          className="min-h-24 w-72 flex justify-center items-center shadow-md hover:shadow-2xl bg-blue-200 hover:bg-blue-500 rounded-s-xl"
          href="/profile/change-password"
        >
          Change Password
        </Link>
      </div>
    </div>
  );
};

export default Profile;
// export default withAuth(Profile);
