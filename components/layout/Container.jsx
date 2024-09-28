const Container = ({ children, classes = '' }) => {
  return <div className={`container px-5 mx-auto ${classes}`}>{children}</div>;
};

export default Container;
