// components/StripeCheckout.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// The /pure entry only loads Stripe.js when loadStripe() is called; the main
// entry injects it on import, which would hit js.stripe.com in mock mode too.
import { loadStripe } from '@stripe/stripe-js/pure';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { USE_MOCKS } from '@/lib/config/mockMode';
import MockPaymentForm from './MockPaymentForm';

// Stripe.js is not loaded at all in mock mode (no key, works offline)
const stripePromise = USE_MOCKS
  ? null
  : loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentElementForm = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: 'Jane Doe', // Optionally capture billing details here
          },
        },
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      onPaymentSuccess(paymentIntent);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button
        type="submit"
        className="mt-6 bg-alternate text-black disabled:hover:bg-alternate disabled:hover:text-black disabled:opacity-75 disabled:cursor-not-allowed border-black border hover:bg-black hover:text-alternate text-lg transition-colors rounded-xl px-4 py-2"
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
    </form>
  );
};

const STATUS = { LOADING: 'loading', READY: 'ready', ERROR: 'error' };

/**
 * Payment form for a reservation. The server works out the amount from the
 * reservation (the browser only sends which reservation).
 */
export default function StripeCheckout({ reservationId, onPaymentSuccess }) {
  const [clientSecret, setClientSecret] = useState('');
  const [status, setStatus] = useState(STATUS.LOADING);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!reservationId) return undefined;

    let isCurrent = true;
    setStatus(STATUS.LOADING);
    setError(null);

    const fetchClientSecret = async () => {
      try {
        const res = await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationId }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.clientSecret) {
          throw Object.assign(
            new Error(data.error || 'We couldn\'t set up the payment.'),
            // 4xx other than 429 won't be fixed by retrying (e.g. the
            // reservation is already paid or its price changed)
            { retryable: res.status >= 500 || res.status === 429 || res.ok }
          );
        }

        // Ignore a response for a reservation that's no longer shown
        if (isCurrent) {
          setClientSecret(data.clientSecret);
          setStatus(STATUS.READY);
        }
      } catch (err) {
        if (isCurrent) {
          setError({
            message:
              err instanceof TypeError // fetch() itself failed (offline, ...)
                ? 'We couldn\'t reach the payment service. Check your connection.'
                : err.message,
            retryable: err.retryable ?? true,
          });
          setStatus(STATUS.ERROR);
        }
      }
    };

    fetchClientSecret();

    return () => {
      isCurrent = false;
    };
  }, [reservationId, attempt]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#f6f9fc',
      colorText: '#30313d',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (status === STATUS.ERROR) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-300 bg-red-50 p-4 text-base text-red-800"
      >
        <p className="font-semibold">Payment form unavailable</p>
        <p className="mb-3">{error.message}</p>
        {error.retryable ? (
          <button
            type="button"
            className="bg-alternate text-black border-black border hover:bg-black hover:text-alternate text-lg transition-colors rounded-xl px-4 py-2"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Try again
          </button>
        ) : (
          <Link href="/make-reservation" className="underline font-semibold">
            Make a new reservation
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {status === STATUS.READY && USE_MOCKS ? (
        <MockPaymentForm
          clientSecret={clientSecret}
          onPaymentSuccess={onPaymentSuccess}
        />
      ) : status === STATUS.READY ? (
        <Elements stripe={stripePromise} options={options}>
          <PaymentElementForm onPaymentSuccess={onPaymentSuccess} />
        </Elements>
      ) : (
        <p role="status">Loading payment form...</p>
      )}
    </div>
  );
}
