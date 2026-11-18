import { ROOM_CATALOG } from '@/lib/static/roomCatalog';
import RoomCard from './RoomCard';

/** All room types as cards, optionally leaving one out (e.g. the current room). */
const RoomGrid = ({
  exclude,
  columns = 4,
  headingLevel = 'h3',
  showAmenities = true,
  priority = false,
}) => {
  const rooms = ROOM_CATALOG.filter(
    (room) => room.typeId !== exclude && room.imageKey !== exclude
  );
  const cols =
    columns === 3
      ? 'sm:grid-cols-2 lg:grid-cols-3'
      : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <ul className={`grid grid-cols-1 gap-6 ${cols}`}>
      {rooms.map((room) => (
        <li key={room.typeId} className="flex">
          <div className="flex w-full flex-col [&>article]:flex-1">
            <RoomCard
              room={room}
              headingLevel={headingLevel}
              showAmenities={showAmenities}
              priority={priority}
            />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default RoomGrid;
