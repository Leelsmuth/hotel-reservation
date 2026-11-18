import Button from './Button';

/** Primary (gold) button. Kept for existing call sites; prefer <Button />. */
const StyledButton = ({
  isSubmitBtn = false,
  clickHandler,
  btnText,
  ...rest
}) => (
  <Button
    type={isSubmitBtn ? 'submit' : 'button'}
    onClick={isSubmitBtn ? undefined : clickHandler}
    variant="primary"
    {...rest}
  >
    {btnText}
  </Button>
);

export default StyledButton;
