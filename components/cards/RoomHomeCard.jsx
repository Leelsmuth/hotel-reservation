import Image from 'next/image';
import Link from 'next/link';

const RoomHomeCard = ({ imageName, roomPath, title, price }) => {
  return (
    <div className="relative group overflow-hidden cursor-pointer">
      <Image
        src={`/rooms/${imageName}.jpg`}
        alt={title}
        width={400}
        height={600}
        className="object-cover w-full h-full transition-all group-hover:scale-105"
      />
      <div className="absolute right-0 top-0 p-2 text-black bg-alternate">
        ${price} per day
      </div>
      <div className="absolute left-0 bottom-0 p-2 text-white text-xl">
        {title}
      </div>
      <Link className="absolute inset-0" href={`/rooms/${roomPath}`}>
        <span className="sr-only">View {title}</span>
      </Link>
    </div>
  );
};

export default RoomHomeCard;
