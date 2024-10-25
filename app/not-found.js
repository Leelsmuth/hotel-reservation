import Container from '@/components/layout/Container';
import MainLayout from '@/components/layout/MainLayout';
import AltStyledLink from '@/components/ui/AltStyledLink';

const NotFound = () => {
  return (
    <MainLayout>
      <Container>
        <div className="text-center">
          <div className="inline-block px-4 text-white uppercase font-semibold rounded-b-full bg-red-400">
            Error
          </div>
          <div className="text-9xl tracking-widest font-bold text-red-600">
            <span>4</span>
            <span>0</span>
            <span>4</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl uppercase">
            Page not found
          </h1>
          <p className="mt-1 text-lg leading-7 text-text-purple font-medium">
            Sorry, we couldn’t find the page you’re looking for.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <AltStyledLink linkText="Back to Home" path="/" />
          </div>
        </div>
      </Container>
    </MainLayout>
  );
};

export default NotFound;
