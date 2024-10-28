import { parsePhoneNumber } from 'libphonenumber-js';
import { isValidPhoneNumber } from 'react-phone-number-input';

/**
 * Validates a phone number.
 * Ensures the number is valid for any country and follows the 10-digit rule for US/Canada.
 *
 * @param {string} phone - The phone number in international format.
 * @returns {boolean} - Returns true if the phone number is valid, false otherwise.
 */
export const validatePhoneNumber = (phone) => {
  // Validate using the built-in isValidPhoneNumber
  if (!isValidPhoneNumber(phone)) {
    return false;
  }

  // Parse the phone number for detailed validation
  try {
    const parsedNumber = parsePhoneNumber(phone);

    // Apply 10-digit rule for US/Canada
    if (
      (parsedNumber.country === 'CA' || parsedNumber.country === 'US') &&
      parsedNumber.nationalNumber.length !== 10
    ) {
      return false;
    }

    // If valid, return true
    return true;
  } catch (e) {
    return false;
  }
};
