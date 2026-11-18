import Button from './Button';

/** Secondary (outlined) button. Kept for existing call sites; prefer <Button />. */
const AltStyledButton = ({
  isSubmitBtn = false,
  clickHandler,
  btnText,
  ...rest
}) => (
  <Button
    type={isSubmitBtn ? 'submit' : 'button'}
    onClick={isSubmitBtn ? undefined : clickHandler}
    variant="secondary"
    {...rest}
  >
    {btnText}
  </Button>
);

export default AltStyledButton;
