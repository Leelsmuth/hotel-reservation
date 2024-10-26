import { Fragment } from 'react';

export const metadata = {
  title: 'Login | Beverly Hills Hotel',
  description: 'Log in to your account!',
};

const PageLayout = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

export default PageLayout;
