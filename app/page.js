'use client';

import RoomHomeCard from '@/components/cards/RoomHomeCard';
import CustomDateRangePicker from '@/components/forms/CustomDateRangePicker';
import Container from '@/components/layout/Container';
import HeadingTwo from '@/components/typography/HeadingTwo';
import StyledLink from '@/components/ui/StyledLink';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Fragment } from 'react';

const Home = () => {
  const router = useRouter();

  const fetchAvailableRooms = () => {
    router.push('/make-reservation');
  };

  return (
    <div className="font-[family-name:var(--font-geist-sans)] text-lg">
      <div className="min-h-[400px] relative">
        <div className="bg-[url('/banner.jpg')] absolute inset-0 bg-no-repeat bg-cover"></div>
        <div className="relative py-10 grid grid-cols-1 md:grid-cols-2 bg-blur bg-white/10 *:relative min-h-[400px]">
          <Container classes="flex flex-col justify-center items-start">
            <h1 className="text-6xl font-bold">
              Forget Busy Work, Start Next Vacation
            </h1>
            <p className="text-xl font-bold mt-4 mb-8">
              We provide what you need to enjoy your holiday with family. Time
              to make another memorable moments
            </p>
            <StyledLink path="/rooms" linkText="Show More" />
          </Container>
        </div>
        <div className="bg-black text-alternate py-6 relative">
          <Container>
            <div className="flex gap-4 items-center justify-center">
              <Image
                alt=""
                src="/bhh-logo.jpg"
                width={80}
                height={80}
                className="object-contain"
              />
              <div className="uppercase text-2xl">
                Welcome to Beverly Hills Hotel
              </div>
            </div>
          </Container>
        </div>
      </div>
      <div className="py-5 bg-background text-black">
        <Container>
          <CustomDateRangePicker fetchAvailableRooms={fetchAvailableRooms} />
        </Container>
      </div>
      <Container classes="my-10">
        <HeadingTwo classes="mb-4">Most Picked</HeadingTwo>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-h-[200px] gap-10">
          <RoomHomeCard
            imageName="deluxe-main"
            roomPath="deluxe-room"
            title="Deluxe Room"
            price="150"
          />
          <div className="flex flex-col gap-6">
            <RoomHomeCard
              imageName="queen-main"
              roomPath="queen-room"
              title="Queen Room"
              price="120"
            />
            <RoomHomeCard
              imageName="king-main"
              roomPath="king-room"
              title="King Room"
              price="135"
            />
          </div>
          <RoomHomeCard
            imageName="presidential-main"
            roomPath="presidential-suite"
            title="Presidential Suite"
            price="350"
          />
        </div>
      </Container>
    </div>
  );
};

export default Home;
