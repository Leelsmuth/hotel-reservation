import { Fragment } from 'react';

export const metadata = {
  title: 'Presidential Suite | Rooms | Beverly Hills Hotel',
  description: 'View our rooms at Beverly Hills Hotel',
};

const PageLayout = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

export default PageLayout;
