/**
 * Live subscription to the length-of-stay discounts (`discounts/daysDiscount`).
 * Calls `onChange({ ELEVEN, TWENTYONE, THIRTYPLUS })` whenever they change and
 * returns an unsubscribe function. Uses fixture values in mock mode.
 */
import { USE_MOCKS } from '@/lib/config/mockMode';
import { db } from '@/lib/firebase/firebase';
import { MOCK_DISCOUNTS } from '@/lib/mock/fixtures';
import { doc, onSnapshot } from 'firebase/firestore';

export const subscribeToDiscounts = (onChange) => {
  if (USE_MOCKS) {
    onChange({ ...MOCK_DISCOUNTS });
    return () => {};
  }

  const discountDocRef = doc(db, 'discounts', 'daysDiscount');

  return onSnapshot(discountDocRef, (doc) => {
    if (doc.exists()) {
      onChange(doc.data());
    } else {
      console.error('No discount data found');
    }
  });
};
