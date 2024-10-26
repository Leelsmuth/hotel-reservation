import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Reserve a room with us | Beverly Hills Hotel',
  description: 'Reserve a room',
};

const PageLayout = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default PageLayout;
