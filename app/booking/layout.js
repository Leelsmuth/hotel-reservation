import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Booking | Beverly Hills Hotel',
  description: 'Secure your reservation!',
};

const PageLayout = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default PageLayout;
