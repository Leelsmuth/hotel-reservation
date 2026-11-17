'use client';

import { useState } from 'react';
import { MOCK_TEST_CARDS as TEST_CARDS } from '@/lib/mock/testCards';

/**
 * Stand-in for Stripe's <PaymentElement /> in mock mode. Nothing is charged
 * and nothing leaves the app. Like Stripe, the payment is confirmed on the
 * server (/api/mock/stripe/confirm), which decides the outcome from the test
 * card number, so the booking step can verify it like a real payment.
 */

const formatCardNumber = (number) => number.replace(/(\d{4})(?=\d)/g, '$1 ');

const inputClasses =
  'border w-full text-lg px-4 py-3 rounded-lg border-gray-300 bg-[#f6f9fc]';

const MockPaymentForm = ({ clientSecret, onPaymentSuccess }) => {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12 / 34');
  const [cvc, setCvc] = useState('123');
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!expiry.trim() || !cvc.trim()) {
      setErrorMessage('Your card details are incomplete.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/mock/stripe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSecret, cardNumber }),
      });
      const { paymentIntent, error } = await response.json();

      if (error || !response.ok) {
        setErrorMessage(error?.message || 'Payment failed. Please try again.');
      } else {
        // Same PaymentIntent object stripe.confirmPayment() resolves with
        onPaymentSuccess(paymentIntent);
      }
    } catch {
      setErrorMessage('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 rounded-lg border border-dashed border-amber-500 bg-amber-50 px-4 py-3 text-base text-amber-900">
        <strong>Mock payment:</strong> no real charge is made. Test cards:
        <ul className="mt-1 list-disc ms-6">
          {Object.entries(TEST_CARDS).map(([number, { label }]) => (
            <li key={number}>
              <button
                type="button"
                className="font-mono underline"
                onClick={() => setCardNumber(formatCardNumber(number))}
              >
                {formatCardNumber(number)}
              </button>{' '}
              ({label})
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-4 text-base">
        <label className="col-span-2">
          Card number
          <input
            className={inputClasses}
            inputMode="numeric"
            autoComplete="off"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
        </label>
        <label>
          Expiration
          <input
            className={inputClasses}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </label>
        <label>
          CVC
          <input
            className={inputClasses}
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-6 bg-alternate text-black disabled:hover:bg-alternate disabled:hover:text-black disabled:opacity-75 disabled:cursor-not-allowed border-black border hover:bg-black hover:text-alternate text-lg transition-colors rounded-xl px-4 py-2"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
    </form>
  );
};

export default MockPaymentForm;
