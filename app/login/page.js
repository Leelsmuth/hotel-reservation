'use client';

import Spinner from '@/components/anim/Spinner';
import AuthLayout from '@/components/layout/AuthLayout';
import Container from '@/components/layout/Container';
import HeadingOne from '@/components/typography/HeadingOne';
import StyledButton from '@/components/ui/StyledButton';
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
        err.message || 'Could not send a new verification email. Please try again.'
      );
    }
  };

  return (
    <AuthLayout>
      <Container classes="my-8">
        <HeadingOne classes="mb-10 text-center">Login</HeadingOne>
        <form onSubmit={handleSignin}>
          <div className="mb-8">
            <label className="block">Email Address</label>
            <input
              type="email"
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block">Password</label>
            <input
              type="password"
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div className="*:w-full">
            <StyledButton btnText="Login" isSubmitBtn={true} />
          </div>
        </form>
        <div className="mt-4 mb-6">
          <Link href="/reset-password" className="text-base">
            Forgot Password?
          </Link>
        </div>
        <div className="text-center">
          <Link href="/signup" className="text-xl underline">
            Create Account
          </Link>
        </div>
        {loading && (
          <div className="min-h-screen flex justify-center items-center max-w-screen-lg mx-auto fixed inset-0">
            <Spinner
              spinnerColor="text-primary"
              spinnerHeight="h-1/5"
              spinnerWidth="w-1/5"
            />
          </div>
        )}
      </Container>
    </AuthLayout>
  );
};

export default Login;
