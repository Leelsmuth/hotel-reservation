import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { USE_MOCKS } from '@/lib/config/mockMode';
import MockPayPalButton from './MockPayPalButton';

const PayPalButton = ({ amount, onSuccess, onError }) => {
  if (USE_MOCKS) {
    return (
      <MockPayPalButton amount={amount} onSuccess={onSuccess} onError={onError} />
    );
  }

  return (
    <PayPalScriptProvider
      options={{ 'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID }}
    >
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount,
                },
              },
            ],
          });
        }}
        onApprove={(data, actions) => {
          return actions.order.capture().then((details) => {
            onSuccess(details); // Handle successful transaction
          });
        }}
        onError={(err) => {
          console.error('PayPal Payment Error: ', err);
          onError(err); // Handle error in transaction
        }}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
