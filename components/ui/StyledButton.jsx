import { Fragment } from 'react';

const StyledButton = ({ isSubmitBtn = false, clickHandler, btnText }) => {
  return (
    <Fragment>
      {isSubmitBtn ? (
        <button
          type="submit"
          className="bg-alternate text-black border-black border hover:bg-black hover:text-alternate text-lg transition-colors rounded-xl px-4 py-2"
        >
          {btnText}
        </button>
      ) : (
        <button
          type="button"
          className="bg-alternate text-black border-black border hover:bg-black hover:text-alternate text-lg transition-colors rounded-xl px-4 py-2"
          onClick={clickHandler}
        >
          {btnText}
        </button>
      )}
    </Fragment>
  );
};

export default StyledButton;
