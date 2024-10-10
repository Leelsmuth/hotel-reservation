const HeadingTwo = ({ children, classes = '' }) => {
  return <h2 className={`text-2xl font-bold ${classes}`}>{children}</h2>;
};

export default HeadingTwo;
