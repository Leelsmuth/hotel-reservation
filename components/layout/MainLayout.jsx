import { Fragment } from 'react';
import Header from './Header';
import Footer from './Footer';

const MainLayout = ({ children }) => {
  return (
    <Fragment>
      <Header />
      <main className="text-lg min-h-[60vh]">{children}</main>
      <Footer />
    </Fragment>
  );
};

export default MainLayout;
