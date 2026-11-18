import Button from './Button';

/** Primary (gold) link styled as a button. Prefer <Button href="..." />. */
const StyledLink = ({ linkText, path, ...rest }) => (
  <Button href={path} variant="primary" {...rest}>
    {linkText}
  </Button>
);

export default StyledLink;
