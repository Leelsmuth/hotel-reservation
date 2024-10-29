const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  price,
  isBooking = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full">
        <h2 className="text-lg font-semibold mb-4">Confirm Action</h2>
        <p className="mb-6">
          {isBooking
            ? `Are you sure you want to cancel this reservation? A 30% fine will be applied. Only $${(
                0.7 * price
              ).toFixed(2)} will be refunded.`
            : 'Are you sure you want to cancel this reservation? This action cannot be reversed'}
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            Yes, Cancel {isBooking ? 'Booking' : 'Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
