import RoomCard from './RoomCard';
import { getRoomByKey } from '@/lib/static/roomCatalog';
import {
  MAX_ADULTS_PER_ROOM,
  MAX_GUESTS_PER_ROOM,
} from '@/lib/booking/occupancy';

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
    maxAdults: base?.maxAdults ?? MAX_ADULTS_PER_ROOM,
    maxGuests: base?.maxGuests ?? MAX_GUESTS_PER_ROOM,
  };
  return <RoomCard room={room} />;
};

export default RoomHomeCard;
