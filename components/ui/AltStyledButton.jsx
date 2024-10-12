import { Fragment } from 'react';

const AltStyledButton = ({ isSubmitBtn = false, clickHandler, btnText }) => {
  return (
    <Fragment>
      {isSubmitBtn ? (
        <button
          type="submit"
          className="bg-transparent text-black border-black border hover:bg-black hover:text-white text-lg transition-colors rounded-xl px-4 py-2"
        >
          {btnText}
        </button>
      ) : (
        <button
          type="button"
          className="bg-transparent text-black border-black border hover:bg-black hover:text-white text-lg transition-colors rounded-xl px-4 py-2"
          onClick={clickHandler}
        >
          {btnText}
        </button>
      )}
    </Fragment>
  );
};

export default AltStyledButton;
