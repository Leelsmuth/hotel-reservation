export const handleError = (showToast, error) => {
  showToast(error, 'error', {
    autoClose: true,
  });
};
