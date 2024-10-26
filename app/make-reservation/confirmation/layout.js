import { Fragment } from 'react';

export const metadata = {
  title: 'Reservation Confirmation | Beverly Hills Hotel',
  description: 'Reservation confirmed!',
};

const PageLayout = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

export default PageLayout;
