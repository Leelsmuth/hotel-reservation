import { Fragment } from 'react';

// This page reads the URL's query string (useSearchParams), which isn't known
// when pages are prerendered at build time. Render it per request so the
// server can send the full page instead of a blank one.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Login | Beverly Hills Hotel',
  description: 'Log in to your account!',
};

const PageLayout = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};

export default PageLayout;
