import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Rooms | Beverly Hills Hotel',
  description: 'View our rooms at Beverly Hills Hotel',
};

const PageLayout = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default PageLayout;
