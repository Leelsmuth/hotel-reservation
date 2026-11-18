import Icon from '../ui/Icon';

/** ids for a field's hint and error, for aria-describedby */
export const describedBy = (id, { hint, error } = {}) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') ||
  undefined;

/**
 * Label + control + hint + error, laid out the same everywhere. The control
 * is passed as children and should use the same `id` (and
 * `aria-describedby={describedBy(id, { hint, error })}`).
 * <TextField /> below does that wiring for plain inputs.
 */
export const Field = ({ id, label, hint, error, className = '', children }) => (
  <div className={className}>
    {label && (
      <label htmlFor={id} className="form-label">
        {label}
      </label>
    )}
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="form-hint">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="form-error">
        <Icon name="error" className="mt-px h-4 w-4" />
        <span>{error}</span>
      </p>
    )}
  </div>
);

/** A labelled text input with hint/error wired up for screen readers. */
export const TextField = ({
  id,
  label,
  hint,
  error,
  className = '',
  inputClassName = '',
  inputRef,
  ...inputProps
}) => (
  <Field id={id} label={label} hint={hint} error={error} className={className}>
    <input
      id={id}
      ref={inputRef}
      className={`form-input ${inputClassName}`}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, { hint, error })}
      {...inputProps}
    />
  </Field>
);

export default Field;
