import RoomCard from './RoomCard';
import { getRoomByKey } from '@/lib/static/roomCatalog';

/**
 * Legacy props (imageName="deluxe-main", roomPath, title, price) mapped onto
 * the shared <RoomCard />. Prefer <RoomCard room={...} /> or <RoomGrid />.
 */
const RoomHomeCard = ({ imageName, roomPath, title, price }) => {
  const key = imageName?.replace(/-main$/, '');
  const base = getRoomByKey(key);
  const room = {
    ...base,
    name: title ?? base?.name,
    price: price !== undefined ? Number(price) : base?.price,
    href: roomPath ? `/rooms/${roomPath}` : base?.href,
    image: imageName ? `/rooms/${imageName}.jpg` : base?.image,
    maxGuests: base?.maxGuests ?? 4,
  };
  return <RoomCard room={room} />;
};

export default RoomHomeCard;
