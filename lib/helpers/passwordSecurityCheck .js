export const passwordSecurityCheck = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return (
    password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber
  );
};
