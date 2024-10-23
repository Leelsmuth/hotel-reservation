const OptionGenerator = ({ numOptions }) => {
  return (
    <>
      {[...Array(numOptions)].map((_, index) => (
        <option value={index + 1} key={index}>
          {index + 1}
        </option>
      ))}
    </>
  );
};

export default OptionGenerator;
