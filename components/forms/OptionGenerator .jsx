/** <option>s 1..numOptions, optionally labelled with a unit ("1 guest", "2 guests"). */
const OptionGenerator = ({ numOptions, unit }) => {
  return (
    <>
      {[...Array(numOptions)].map((_, index) => {
        const value = index + 1;
        return (
          <option value={value} key={value}>
            {unit ? `${value} ${value === 1 ? unit : `${unit}s`}` : value}
          </option>
        );
      })}
    </>
  );
};

export default OptionGenerator;
