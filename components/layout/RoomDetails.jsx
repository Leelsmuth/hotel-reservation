import Image from 'next/image';
import React from 'react';
import Container from './Container';
import StyledLink from '../ui/StyledLink';
import RoomHomeCard from '../cards/RoomHomeCard';

const RoomDetails = ({ name }) => {
  return (
    <Container>
      <div className="mt-10 text-right">
        <StyledLink linkText="Make Reservation" path="/make-reservation" />
      </div>
      <div>
        <h1 className="capitalize text-3xl font-bold text-center my-5">
          {name === 'presidential' ? `${name} suite` : `${name} room`}
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Image
            src={`/rooms/${name}-main.jpg`}
            alt=""
            width={500}
            height={700}
            className="object-cover h-full w-full"
          />
          <div className="flex flex-col space-between gap-6">
            <Image
              src={`/rooms/${name}-top.jpg`}
              alt=""
              width={500}
              height={300}
              className="object-cover h-auto w-full"
            />
            <Image
              src={`/rooms/${name}-bottom.jpg`}
              alt=""
              width={500}
              height={300}
              className="object-cover h-auto w-full"
            />
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6">About the place</h2>
        <p>
          Located in the heart of ‘Toronto’, with breaking views of the city,
          Beverley Hills Hotel offers a one-of-a-kind experience with wonderful
          services and amenities. A hub for both business and leisure. Our rooms
          are well equipped with a private bathroom, flat screen TV, AC/heating
          unit, and a refrigerator. Beverly Hills Hotel Restaurant offers
          delicious continental and intercontinental cuisine and fine dining
          experience from our well experienced chefs.
        </p>
        <p>
          Experience an amazing atmosphere with great music, varieties of bar
          foods, mocktails and cocktails in our lounge/bar. Enjoy a relaxing
          swim in our pools, feel refreshed after a great workout in our
          well-equipped fitness gym. Utilize our calming and soothing spa and
          sauna services with expert spa therapists and masseuse. Beverly Hills
          Hotel is the perfect choice for an unforgettable stay
        </p>
        <div className="flex gap-6 my-8 justify-between flex-wrap">
          <div>
            <Image
              src="/amenities/icons/ic_bedroom.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">1 bedroom</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_livingroom.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">1 living room</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_bathroom.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">1 bathroom</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_diningroom.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">1 dining room</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_wifi.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">10 mbp/s</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_ac.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">7 units ready</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_kulkas.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">1 refigerator</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_tv.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">2 television</div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-6">Treasure to choose</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-wrap">
            <div>
              <Image
                src="/amenities/gym.jpg"
                alt=""
                height={150}
                width={200}
                className="object-cover"
              />
              <div className="mt-3">Gym</div>
            </div>
            <div>
              <Image
                src="/amenities/pool.jpg"
                alt=""
                height={150}
                width={200}
                className="object-cover"
              />
              <div className="mt-3">Swimming Pool</div>
            </div>
            <div>
              <Image
                src="/amenities/restaurant.jpg"
                alt=""
                height={150}
                width={200}
                className="object-cover"
              />
              <div className="mt-3">Swimming Pool</div>
            </div>
            <div>
              <Image
                src="/amenities/spa.jpg"
                alt=""
                height={150}
                width={200}
                className="object-cover"
              />
              <div className="mt-3">Spa</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 text-right mb-16">
        <StyledLink linkText="Make Reservation" path="/make-reservation" />
      </div>
      <hr />
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Check out our other rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {name !== 'deluxe' && (
            <RoomHomeCard
              imageName="deluxe-main"
              roomPath="deluxe-room"
              title="Deluxe Room"
              price="150"
            />
          )}
          {name !== 'queen' && (
            <RoomHomeCard
              imageName="queen-main"
              roomPath="queen-room"
              title="Queen Room"
              price="120"
            />
          )}
          {name !== 'king' && (
            <RoomHomeCard
              imageName="king-main"
              roomPath="king-room"
              title="King Room"
              price="135"
            />
          )}
          {name !== 'presidential' && (
            <RoomHomeCard
              imageName="presidential-main"
              roomPath="presidential-suite"
              title="Presidential Suite"
              price="350"
            />
          )}
        </div>
      </div>
    </Container>
  );
};

export default RoomDetails;
