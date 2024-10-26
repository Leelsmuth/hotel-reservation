import { Fragment } from 'react';

export const metadata = {
  title: 'Deluxe Room | Rooms | Beverly Hills Hotel',
  description: 'View our rooms at Beverly Hills Hotel',
};

const PageLayout = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

export default PageLayout;
