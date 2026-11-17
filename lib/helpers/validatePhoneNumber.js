import { parsePhoneNumber, validatePhoneNumberLength } from 'libphonenumber-js';
import { isValidPhoneNumber } from 'react-phone-number-input';
import countryNames from 'react-phone-number-input/locale/en';

const NANP_CALLING_CODE = '1'; // US, Canada and the rest of the +1 zone

const describeRegion = (parsedNumber) => {
  if (parsedNumber?.countryCallingCode === NANP_CALLING_CODE) {
    return 'US/Canada';
  }
  return countryNames[parsedNumber?.country] || null;
};

const safeParse = (phone) => {
  try {
    return parsePhoneNumber(phone);
  } catch (e) {
    return undefined;
  }
};

/**
 * Explains what is wrong with a phone number, or returns null if it is valid.
 * Expects the E.164 value produced by <PhoneNumberInput /> (e.g. "+14165550123").
 *
 * @param {string} phone - The phone number in international format.
 * @returns {string|null} - A user-facing error message, or null if valid.
 */
export const getPhoneNumberError = (phone) => {
  if (!phone) {
    return 'Please enter a phone number.';
  }

  const parsedNumber = safeParse(phone);
  const region = describeRegion(parsedNumber);
  const isNanp = parsedNumber?.countryCallingCode === NANP_CALLING_CODE;

  switch (validatePhoneNumberLength(phone)) {
    case 'TOO_SHORT':
      return isNanp
        ? 'This phone number is too short. US/Canada numbers have 10 digits (area code + number).'
        : 'This phone number is too short.';
    case 'TOO_LONG':
      return isNanp
        ? 'This phone number is too long. US/Canada numbers have 10 digits (area code + number).'
        : 'This phone number is too long.';
    case 'INVALID_COUNTRY':
    case 'NOT_A_NUMBER':
    case 'INVALID_LENGTH':
      return 'Please enter a valid phone number.';
    default:
      break;
  }

  // Right length, but not a number that can exist (e.g. an unassigned area code)
  if (!isValidPhoneNumber(phone) || !parsedNumber) {
    if (isNanp) {
      return 'This is not a valid US/Canada phone number. Please check the area code, e.g. (416) 555-0123.';
    }
    return region
      ? `This is not a valid phone number for ${region}. Please check the number and the selected country.`
      : 'Please enter a valid phone number.';
  }

  // Apply 10-digit rule for US/Canada
  if (
    (parsedNumber.country === 'CA' || parsedNumber.country === 'US') &&
    parsedNumber.nationalNumber.length !== 10
  ) {
    return 'US/Canada numbers must have 10 digits (area code + number).';
  }

  return null;
};

/**
 * Validates a phone number.
 * Ensures the number is valid for any country and follows the 10-digit rule for US/Canada.
 *
 * @param {string} phone - The phone number in international format.
 * @returns {boolean} - Returns true if the phone number is valid, false otherwise.
 */
export const validatePhoneNumber = (phone) => getPhoneNumberError(phone) === null;
