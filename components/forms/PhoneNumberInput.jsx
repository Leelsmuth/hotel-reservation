'use client';

import { useState } from 'react';
import { getExampleNumber } from 'libphonenumber-js';
import examples from 'libphonenumber-js/examples.mobile.json';
import PhoneInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import CountrySelect from './CountrySelect';

/**
 * Phone number field used across the app. `value`/`onChange` use the E.164
 * format (e.g. "+14165550123"); validate with getPhoneNumberError() from
 * lib/helpers/validatePhoneNumber.js.
 *
 * - Numbers are typed in the local format of the selected country
 *   ("416 555 0123"), so there is no editable "+1" prefix that users can
 *   accidentally delete. Deleting it made 10 digits parse as another country,
 *   e.g. 4165550123 -> +41 (Switzerland). Pasting a full international number
 *   ("+44 7911 123456") still works and switches the country automatically.
 * - Flags are bundled SVGs (no requests to an external flag CDN) and the
 *   country list shows flags, names and dialling codes (see CountrySelect).
 * - The placeholder is an example number for the selected country.
 */
const PINNED_COUNTRIES = ['CA', 'US'];

const examplePlaceholder = (country) => {
  try {
    return getExampleNumber(country, examples)?.formatNational() ?? '';
  } catch {
    return '';
  }
};

const PhoneNumberInput = ({
  value,
  onChange,
  defaultCountry = 'CA',
  className = '',
  onCountryChange,
  ...rest
}) => {
  const [country, setCountry] = useState(defaultCountry);

  return (
    <PhoneInput
      defaultCountry={defaultCountry}
      value={value}
      onChange={onChange}
      onCountryChange={(newCountry) => {
        setCountry(newCountry);
        onCountryChange?.(newCountry);
      }}
      flags={flags}
      countrySelectComponent={CountrySelect}
      addInternationalOption={false}
      countryOptionsOrder={[...PINNED_COUNTRIES, '|', '...']}
      placeholder={examplePlaceholder(country)}
      autoComplete="tel"
      className={className}
      {...rest}
    />
  );
};

export default PhoneNumberInput;
