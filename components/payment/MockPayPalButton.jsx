'use client';

import { useState } from 'react';

/**
 * Stand-in for the PayPal Smart Buttons in mock mode: no PayPal SDK is loaded
 * and nothing is charged. "Pay" resolves with an object shaped like the
 * result of `actions.order.capture()`.
 */
const SIMULATED_PROCESSING_MS = 1200;

const MockPayPalButton = ({ amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const simulate = async (succeed) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_PROCESSING_MS));
    setLoading(false);

    if (!succeed) {
      const error = new Error('Mock PayPal payment failed');
      console.error('PayPal Payment Error: ', error);
      onError?.(error);
      return;
    }

    const orderId = `MOCK${Date.now().toString(36).toUpperCase()}`;
    onSuccess?.({
      id: orderId,
      intent: 'CAPTURE',
      status: 'COMPLETED',
      payer: {
        name: { given_name: 'Mock', surname: 'Buyer' },
        email_address: 'buyer@example.com',
        payer_id: 'MOCKPAYERID',
      },
      purchase_units: [
        {
          amount: { currency_code: 'CAD', value: String(amount) },
          payments: {
            captures: [
              {
                id: `${orderId}-CAPTURE`,
                status: 'COMPLETED',
                amount: { currency_code: 'CAD', value: String(amount) },
              },
            ],
          },
        },
      ],
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    });
  };

  return (
    <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-4 text-sm">
      <div className="mb-3 text-amber-900">
        <strong>Mock PayPal:</strong> no real charge is made.
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => simulate(true)}
          className="rounded-full bg-[#ffc439] px-6 py-2 font-bold text-[#003087] disabled:opacity-60"
        >
          {loading ? 'Processing...' : `Pay $${amount} with PayPal`}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => simulate(false)}
          className="underline text-ink-700 disabled:opacity-60"
        >
          Simulate failure
        </button>
      </div>
    </div>
  );
};

export default MockPayPalButton;
