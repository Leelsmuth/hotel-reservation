import { Fragment } from 'react';

export const metadata = {
  title: 'Booking Confirmation | Beverly Hills Hotel',
  description: 'Booking confirmed!',
};

const PageLayout = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

export default PageLayout;
