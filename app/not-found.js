import Container from '@/components/layout/Container';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';

const NotFound = () => {
  return (
    <MainLayout>
      <Container classes="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p
          className="font-display text-7xl font-semibold text-gold-600 sm:text-8xl"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-ink-600">
          Sorry, we couldn't find the page you're looking for. It may have
          moved, or the link may be incorrect.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/" icon="home">
            Back to home
          </Button>
          <Button href="/rooms" variant="secondary">
            Browse rooms
          </Button>
        </div>
      </Container>
    </MainLayout>
  );
};

export default NotFound;
