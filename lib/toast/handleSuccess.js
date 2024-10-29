export const handleSuccess = (showToast, message) => {
  showToast(message, 'success', {
    autoClose: true,
  });
};
