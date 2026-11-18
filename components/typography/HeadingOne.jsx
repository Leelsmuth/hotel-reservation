const HeadingOne = ({ children, classes = '', id }) => {
  return (
    <h1
      id={id}
      className={`font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl ${classes}`}
    >
      {children}
    </h1>
  );
};

export default HeadingOne;
