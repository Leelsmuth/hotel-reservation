import { Fragment } from 'react';

const StyledButton = ({ isSubmitBtn = false, clickHandler, btnText }) => {
  return (
    <Fragment>
      {isSubmitBtn ? (
        <button
          type="submit"
          className="bg-orange-800 text-white hover:bg-orange-900 transition-colors rounded-xl px-4 py-2"
        >
          {btnText}
        </button>
      ) : (
        <button
          type="button"
          className="bg-orange-800 text-white hover:bg-orange-900 transition-colors rounded-xl px-4 py-2"
          onClick={clickHandler}
        >
          {btnText}
        </button>
      )}
    </Fragment>
  );
};

export default StyledButton;
