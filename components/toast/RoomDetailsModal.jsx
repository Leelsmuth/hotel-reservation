import { ROOM_DETAILS } from '@/lib/static/roomLegend';

const RoomDetailsModal = ({ isOpen, onClose, roomDetails = ROOM_DETAILS }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full relative overflow-y-auto h-[70vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-5xl font-medium text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold mb-4">
          Room & Property amenities
        </h2>

        <section className="mb-6">
          <h3 className="text-lg font-bold mb-2">Popular amenities</h3>
          <ul className="list-disc pl-5 space-y-1 text-base md:columns-2">
            {roomDetails.popularAmenities.map((amenity, index) => (
              <li key={index}>{amenity}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-bold mb-2">Food and drink</h3>
          <ul className="list-disc pl-5 space-y-1 text-base md:columns-2">
            {roomDetails.foodAndDrink.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-bold mb-2">What to do</h3>
          <ul className="list-disc pl-5 space-y-1 text-base md:columns-2">
            {roomDetails.whatToDo.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-bold mb-2">Working away</h3>
          <ul className="list-disc pl-5 space-y-1 text-base md:columns-2">
            {roomDetails.workingAway.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-bold mb-2">Services</h3>
          <ul className="list-disc pl-5 space-y-1 text-base md:columns-2">
            {roomDetails.services.map((service, index) => (
              <li key={index}>{service}</li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-bold mb-2">Facilities</h3>
          <ul className="list-disc pl-5 space-y-1 text-base md:columns-2">
            {roomDetails.facilities.map((facility, index) => (
              <li key={index}>{facility}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default RoomDetailsModal;
