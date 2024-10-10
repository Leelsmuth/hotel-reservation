import Image from 'next/image';

const RoomReservationCard = ({
  imageName,
  title,
  price,
  roomTypeId,
  reservationHandler,
}) => {
  return (
    <div className="relative group overflow-hidden cursor-pointer grid grid-cols-1 md:grid-cols-2 shadow-md hover:shadow-lg rounded-e-3xl">
      <div className="overflow-hidden relative md:static">
        <Image
          src={`/rooms/${imageName}.jpg`}
          alt={title}
          width={400}
          height={400}
          className="object-cover w-full min-w-[300px] min-h-full h-[400px] transition-all group-hover:scale-105"
        />
        <div className="absolute right-0 top-0 p-2 text-black bg-alternate">
          ${price} per day
        </div>
        <div className="absolute left-0 bottom-0 p-2 text-white text-xl">
          <div>{title}</div>
          <div className="uppercase font-bold">Reserve now</div>
        </div>
        <button
          className="absolute inset-0"
          type="button"
          onClick={() => reservationHandler(roomTypeId)}
        >
          <span className="sr-only">View {title}</span>
        </button>
      </div>
      <div className="px-4 py-8">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-lg">
          Located in the heart of ‘Toronto’, with breaking views of the city,
          Beverley Hills Hotel offers a one-of-a-kind experience with wonderful
          services and amenities. A hub for both business and leisure. Our rooms
          are well equipped with a private bathroom, flat screen TV, AC/heating
          unit, and a refrigerator.
        </p>
        <div className="flex gap-6 my-8 flex-wrap">
          <div>
            <Image
              src="/amenities/icons/ic_bedroom.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">Bedroom</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_diningroom.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">Dining</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_wifi.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">Wifi</div>
          </div>
          <div>
            <Image
              src="/amenities/icons/ic_tv.svg"
              alt=""
              height={32}
              width={28}
              className="w-auto object-contain"
            />
            <div className="mt-3">TV</div>
          </div>
        </div>
        <div className="inline-block  py-2 px-3 text-black bg-alternate border-black border group-hover:bg-black group-hover:text-alternate transition-colors rounded-xl">
          Reserve Now
        </div>
      </div>
    </div>
  );
};

export default RoomReservationCard;
