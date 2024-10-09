import RoomHomeCard from '@/components/cards/RoomHomeCard';
import Container from '@/components/layout/Container';

const Rooms = () => {
  return (
    <Container classes="mt-10 mb-20">
      <h1 className="text-3xl font-bold">Viewing Rooms</h1>
      <div className="grid grid-cols-1 my-6 md:grid-cols-2 lg:grid-cols-3 min-h-[200px] gap-10">
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
  );
};

export default Rooms;
