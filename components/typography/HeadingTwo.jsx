const HeadingTwo = ({ children, classes = '', id }) => {
  return (
    <h2
      id={id}
      className={`font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl ${classes}`}
    >
      {children}
    </h2>
  );
};

export default HeadingTwo;
