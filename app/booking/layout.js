import MainLayout from '@/components/layout/MainLayout';

// This page reads the URL's query string (useSearchParams), which isn't known
// when pages are prerendered at build time. Render it per request so the
// server can send the full page instead of a blank one.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Booking | Beverly Hills Hotel',
  description: 'Secure your reservation!',
};

const PageLayout = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

export default PageLayout;
