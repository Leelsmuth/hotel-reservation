'use client';

import AuthLayout from '@/components/layout/AuthLayout';
import { TextField } from '@/components/forms/Field';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/context/ToastContext';
import { authClient } from '@/lib/auth/authClient';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const { login, loading, user, logout } = useAuth();
  const { showToast, removeToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const effectCalled = useRef(false);
  const errorToastId = useRef(null);

  const handleSignin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const signedInUser = await login(email, password);
      handleSignedInUser(signedInUser);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      handleError(err.message || 'Something went wrong. Please try again.');
    }
  };

  const handleSignedInUser = (signedInUser) => {
    if (signedInUser.emailVerified) {
      handleSuccess('Login Successful!. Redirecting...');
      router.push(redirectTo);
    } else {
      setError('Please verify your email before logging in.');
      handleErrorAction(signedInUser);
    }
  };

  // Already signed in when the page opens. Waits for any auth action in
  // flight (e.g. "Sign out" navigates here before sign-out has finished), then
  // runs once per mount (the ref also stops React StrictMode's double run).
  useEffect(() => {
    if (loading || effectCalled.current) return;
    effectCalled.current = true;

    if (user) {
      handleSignedInUser(user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleSuccess = (message) => {
    showToast(message, 'success', {
      autoClose: true,
    });
  };

  const handleError = (error) => {
    showToast(error, 'error', {
      autoClose: true,
    });
  };

  // The "please verify" toast stays until acted on, so only keep one and
  // remove it when leaving the page
  const dismissVerifyToast = () => {
    if (errorToastId.current) {
      removeToast(errorToastId.current);
      errorToastId.current = null;
    }
  };

  useEffect(() => dismissVerifyToast, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Takes the user explicitly: when called right after login(), `user` from
  // this render's closure is still the pre-login value.
  const handleErrorAction = (unverifiedUser) => {
    dismissVerifyToast();
    errorToastId.current = showToast(
      'Please verify your email before logging in.',
      'error',
      {
        action: () => resendVerification(unverifiedUser),
        actionLabel: 'Get new link',
        autoClose: false,
      }
    );
  };

  const resendVerification = async (unverifiedUser) => {
    // Dismiss first so a double click can't send two emails
    dismissVerifyToast();
    try {
      await authClient.sendEmailVerification(unverifiedUser);
      handleSuccess('Verification mail resent! Check inbox/junk');
      logout();
    } catch (err) {
      handleError(
        err.message ||
          'Could not send a new verification email. Please try again.'
      );
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see and manage your reservations and bookings."
    >
      <form onSubmit={handleSignin} className="space-y-5" noValidate={false}>
        {error && (
          <Alert tone="error" title="We couldn't log you in">
            {error}
          </Alert>
        )}
        <TextField
          id="login-email"
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <label htmlFor="login-password" className="form-label mb-0">
              Password
            </label>
            <Link href="/reset-password" className="link text-sm">
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          loadingText="Please wait…"
        >
          Log in
        </Button>
      </form>
      <p className="mt-8 border-t border-ink-100 pt-6 text-center text-sm text-ink-600">
        New to Beverly Hills Hotel?{' '}
        <Link
          href={
            redirectTo !== '/'
              ? `/signup?redirectTo=${encodeURIComponent(redirectTo)}`
              : '/signup'
          }
          className="link"
        >
          Create an account
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-ink-600">
        You can also book without an account.{' '}
        <Link href="/make-reservation" className="link">
          Book as a guest
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
