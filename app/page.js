'use client';

import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import Container from '@/components/layout/Container';
import StyledLink from '@/components/ui/StyledLink';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Home = () => {
  const router = useRouter();

  const fetchAvailableRooms = () => {
    router.push('/make-reservation');
  };

  return (
    <Container classes="font-[family-name:var(--font-geist-sans)]">
      <Image
        className="w-full object-contain h-auto rounded-3xl"
        src="/banner.jpg"
        alt="Banner"
        width={1100}
        height={700}
        priority
      />
      <div className="my-5">
        <CustomDateRangePicker fetchAvailableRooms={fetchAvailableRooms} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 mt-9 gap-10">
        <div className="md:max-w-md">
          <div>Rooms</div>
          <div>Check out our rooms</div>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
          <StyledLink path="/rooms" linkText="View Rooms" />
        </div>
        <div className="relative mb-20">
          <Image
            src="/landing-large.jpg"
            alt=""
            className="ml-auto rounded-3xl"
            width={500}
            height={300}
          />
          <Image
            src="/landing-small.jpg"
            alt=""
            className="absolute -bottom-14 rounded-3xl border-8 border-white"
            width={350}
            height={200}
          />
        </div>
      </div>
    </Container>
  );
};

export default Home;
