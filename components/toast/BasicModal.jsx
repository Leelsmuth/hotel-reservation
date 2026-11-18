'use client';

import Modal from '../ui/Modal';
import Button from '../ui/Button';

const BasicModal = ({
  isOpen,
  onClose,
  title,
  actionHandler,
  children,
  actionLabel,
  closeOnOverlayClick = false,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="lg"
    closeOnOverlayClick={closeOnOverlayClick}
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {actionLabel && (
          <Button variant="danger" onClick={actionHandler}>
            {actionLabel}
          </Button>
        )}
      </>
    }
  >
    <div className="space-y-4">{children}</div>
  </Modal>
);

export default BasicModal;
