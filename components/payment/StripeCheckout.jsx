// components/StripeCheckout.js
'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

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

export default function StripeCheckout({ amount, onPaymentSuccess }) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const fetchClientSecret = async () => {
      const res = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(amount) }),
      });

      const { clientSecret } = await res.json();
      setClientSecret(clientSecret);
    };

    fetchClientSecret();
  }, [amount]);

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

  return (
    <div>
      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <PaymentElementForm onPaymentSuccess={onPaymentSuccess} />
        </Elements>
      ) : (
        <p>Loading payment form...</p>
      )}
    </div>
  );
}
