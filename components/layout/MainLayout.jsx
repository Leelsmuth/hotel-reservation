import { Fragment } from 'react';
import Header from './Header';
import Footer from './Footer';
import SkipLink from '../ui/SkipLink';

const MainLayout = ({ children }) => {
  return (
    <Fragment>
      <SkipLink />
      <div className="flex min-h-svh flex-col">
        <Header />
        {/* No tabIndex here: SkipLink adds one only while moving focus in */}
        <main id="main-content" className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </div>
    </Fragment>
  );
};

export default MainLayout;
