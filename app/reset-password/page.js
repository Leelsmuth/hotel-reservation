'use client';

import Spinner from '@/components/anim/Spinner';
import AuthLayout from '@/components/layout/AuthLayout';
import Container from '@/components/layout/Container';
import HeadingOne from '@/components/typography/HeadingOne';
import StyledButton from '@/components/ui/StyledButton';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/context/ToastContext';
import { handleSuccess } from '@/lib/toast/handleSuccess';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

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

  if (isSignedIn || loading)
    return (
      <div className="min-h-screen flex justify-center items-center max-w-screen-lg mx-auto fixed inset-0">
        <Spinner
          spinnerColor="text-primary"
          spinnerHeight="h-1/5"
          spinnerWidth="w-1/5"
        />
      </div>
    );

  return (
    <AuthLayout>
      <Container classes="my-8">
        <HeadingOne>Forgot your info?</HeadingOne>
        <div className="text-primary text-xl mb-3">Get a new password</div>
        <div className="mb-8">
          Enter your registered Email Address on our records and will send you
          information on how to reset your password
        </div>
        <form onSubmit={handlePasswordReset}>
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
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {message && <p style={{ color: 'green' }}>{message}</p>}
          <div className="*:w-full">
            <StyledButton btnText="Submit" isSubmitBtn={true} />
          </div>
        </form>
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

export default ResetPassword;
