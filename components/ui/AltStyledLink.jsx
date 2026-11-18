import Button from './Button';

/** Secondary (outlined) link styled as a button. Prefer <Button href="..." />. */
const AltStyledLink = ({ linkText, path, ...rest }) => (
  <Button href={path} variant="secondary" {...rest}>
    {linkText}
  </Button>
);

export default AltStyledLink;
