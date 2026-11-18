'use client';

import AuthLayout from '@/components/layout/AuthLayout';
import { TextField } from '@/components/forms/Field';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/context/ToastContext';
import { handleSuccess } from '@/lib/toast/handleSuccess';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ResetPassword = () => {
  const router = useRouter();
  const { initiatePasswordReset, loading, user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await initiatePasswordReset(email);
      setMessage(
        'Password reset email has been sent. Please check your inbox.'
      );
      handleSuccess(
        showToast,
        'Password reset email has been sent. Please check your inbox.'
      );
      router.push('login');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  // Signed-in users manage their account from /profile. Unverified users are
  // technically signed in (after a login attempt) but can't use the app, so
  // they can still reset their password here.
  const isSignedIn = Boolean(user?.emailVerified);

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/profile');
    }
  }, [isSignedIn, router]);

  if (isSignedIn)
    return <LoadingState overlay label="Redirecting to your account…" />;

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email address on your account and we'll send you a link to choose a new password."
    >
      <form onSubmit={handlePasswordReset} className="space-y-5">
        {error && (
          <Alert tone="error" title="We couldn't send the link">
            {error}
          </Alert>
        )}
        {message && <Alert tone="success">{message}</Alert>}
        <TextField
          id="reset-email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          loadingText="Please wait…"
        >
          Send reset link
        </Button>
      </form>
      <p className="mt-8 border-t border-ink-100 pt-6 text-center text-sm text-ink-600">
        Remembered it?{' '}
        <Link href="/login" className="link">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ResetPassword;
