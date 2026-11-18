'use client';

import Alert from '@/components/ui/Alert';

const ChangePassword = () => {
  return (
    <section
      aria-labelledby="password-title"
      className="card max-w-2xl p-5 sm:p-6"
    >
      <h2
        id="password-title"
        className="font-display text-2xl font-semibold text-ink-900"
      >
        Password
      </h2>
      <Alert
        tone="info"
        className="mt-5"
        title="Changing your password here isn't available yet"
      >
        To change it now, log out and use “Forgot password?” on the log-in page.
        We'll email you a link to choose a new one.
      </Alert>
    </section>
  );
};

export default ChangePassword;
