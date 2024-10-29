const BasicModal = ({
  isOpen,
  onClose,
  title,
  actionHandler,
  children,
  actionLabel,
  closeOnOverlayClick = false,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl w-full max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-5xl"
          >
            &times;
          </button>
        </div>
        {children}
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white"
          >
            Close
          </button>
          {actionLabel && (
            <button
              onClick={actionHandler}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicModal;
