import Container from './Container';

const Footer = () => {
  return (
    <footer className="bg-orange-800 py-6 text-white border-t-4 border-t-black mt-5">
      <Container>
        <div className="text-center mt-10 mb-5">
          &copy; {new Date().getFullYear()} Copyright Azure Crest Hotel
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
