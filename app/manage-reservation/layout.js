import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Manage Reservation | Beverly Hills Hotel',
  description: 'Manage your reservation qith booking ID and email',
};

const PageLayout = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default PageLayout;
