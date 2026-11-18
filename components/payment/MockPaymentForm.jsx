'use client';

import { useState } from 'react';
import { MOCK_TEST_CARDS as TEST_CARDS } from '@/lib/mock/testCards';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import { Field } from '../forms/Field';
import { formatPrice } from '@/lib/helpers/formatters';

/**
 * Stand-in for Stripe's <PaymentElement /> in mock mode. Nothing is charged
 * and nothing leaves the app. Like Stripe, the payment is confirmed on the
 * server (/api/mock/stripe/confirm), which decides the outcome from the test
 * card number, so the booking step can verify it like a real payment.
 */

const formatCardNumber = (number) => number.replace(/(\d{4})(?=\d)/g, '$1 ');

const MockPaymentForm = ({ clientSecret, onPaymentSuccess, amount }) => {
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

  const label =
    Number.isFinite(Number(amount)) && amount !== undefined && amount !== null
      ? `Pay ${formatPrice(amount)}`
      : 'Pay now';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Mock payment:</strong> no real charge is made. Test cards:
        <ul className="mt-1 list-disc ms-5">
          {Object.entries(TEST_CARDS).map(([number, { label: cardLabel }]) => (
            <li key={number}>
              <button
                type="button"
                className="rounded font-mono underline underline-offset-2"
                onClick={() => setCardNumber(formatCardNumber(number))}
              >
                {formatCardNumber(number)}
              </button>{' '}
              ({cardLabel})
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field id="mock-card-number" label="Card number" className="col-span-2">
          <input
            id="mock-card-number"
            className="form-input font-mono tracking-wider"
            inputMode="numeric"
            autoComplete="off"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
        </Field>
        <Field id="mock-card-expiry" label="Expiration">
          <input
            id="mock-card-expiry"
            className="form-input"
            placeholder="MM / YY"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </Field>
        <Field id="mock-card-cvc" label="CVC">
          <input
            id="mock-card-cvc"
            className="form-input"
            inputMode="numeric"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
          />
        </Field>
      </div>
      {errorMessage && (
        <Alert tone="error" title="Payment failed">
          {errorMessage}
        </Alert>
      )}
      <Button
        type="submit"
        size="lg"
        fullWidth
        icon="lock"
        loading={loading}
        loadingText="Processing payment…"
      >
        {label}
      </Button>
    </form>
  );
};

export default MockPaymentForm;
