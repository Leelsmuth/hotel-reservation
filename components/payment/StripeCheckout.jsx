// components/StripeCheckout.js
'use client';

import { useState, useEffect } from 'react';
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
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import { formatPrice } from '@/lib/helpers/formatters';

export const payLabel = (amount) =>
  Number.isFinite(Number(amount)) && amount !== undefined && amount !== null
    ? `Pay ${formatPrice(amount)}`
    : 'Pay now';

// Stripe.js is not loaded at all in mock mode (no key, works offline)
const stripePromise = USE_MOCKS
  ? null
  : loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentElementForm = ({ onPaymentSuccess, amount }) => {
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
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
        disabled={!stripe}
        loading={loading}
        loadingText="Processing payment…"
      >
        {payLabel(amount)}
      </Button>
    </form>
  );
};

const STATUS = { LOADING: 'loading', READY: 'ready', ERROR: 'error' };

/**
 * Payment form for a reservation. The server works out the amount from the
 * reservation (the browser only sends which reservation).
 */
export default function StripeCheckout({
  reservationId,
  onPaymentSuccess,
  amount,
}) {
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
            new Error(data.error || "We couldn't set up the payment."),
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
                ? "We couldn't reach the payment service. Check your connection."
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

  // Match Stripe's fields to the app's form controls (see globals.css)
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#81640F',
      colorBackground: '#ffffff',
      colorText: '#1C1915',
      colorTextSecondary: '#57514A',
      colorDanger: '#B91C1C',
      borderRadius: '8px',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': { borderColor: '#8C857D', boxShadow: 'none' },
      '.Input:focus': {
        borderColor: '#81640F',
        boxShadow: '0 0 0 3px rgba(210, 174, 78, 0.45)',
      },
      '.Label': { fontWeight: '600', color: '#2A2621' },
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (status === STATUS.ERROR) {
    return (
      <Alert
        tone="error"
        title="Payment form unavailable"
        action={
          error.retryable ? (
            <Button
              size="sm"
              variant="dark"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Try again
            </Button>
          ) : (
            <Button size="sm" variant="secondary" href="/make-reservation">
              Make a new reservation
            </Button>
          )
        }
      >
        {error.message}
      </Alert>
    );
  }

  return (
    <div>
      {status === STATUS.READY && USE_MOCKS ? (
        <MockPaymentForm
          clientSecret={clientSecret}
          onPaymentSuccess={onPaymentSuccess}
          amount={amount}
        />
      ) : status === STATUS.READY ? (
        <Elements stripe={stripePromise} options={options}>
          <PaymentElementForm
            onPaymentSuccess={onPaymentSuccess}
            amount={amount}
          />
        </Elements>
      ) : (
        <div
          role="status"
          className="space-y-3"
          aria-label="Loading payment form"
        >
          <div className="h-11 animate-pulse rounded-lg bg-ink-100" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-11 animate-pulse rounded-lg bg-ink-100" />
            <div className="h-11 animate-pulse rounded-lg bg-ink-100" />
          </div>
          <p className="pt-1 text-sm text-ink-600">
            Loading secure payment form…
          </p>
        </div>
      )}
    </div>
  );
}
