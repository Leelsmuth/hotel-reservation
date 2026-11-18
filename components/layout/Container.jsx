/**
 * Page-width wrapper. Every page uses the same content width (max 1280px)
 * and side padding, so headers, heroes, listings and the footer line up.
 */
const Container = ({ children, classes = '', as: Tag = 'div' }) => {
  return (
    <Tag className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${classes}`}>
      {children}
    </Tag>
  );
};

export default Container;
