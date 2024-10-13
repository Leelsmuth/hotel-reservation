'use client';

import AuthLayout from '@/components/layout/AuthLayout';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/firebase';
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import Container from '@/components/layout/Container';
import Link from 'next/link';

const AuthManager = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionMode = searchParams.get('mode') || '';
  const actionCode = searchParams.get('oobCode') || '';
  const continueUrl = searchParams.get('continueUrl');
  const lang = searchParams.get('lang') || 'en';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('Verifying...');

  // Handle password reset submission
  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Confirm the password reset using Firebase API
      await confirmPasswordReset(auth, actionCode, password);

      // Redirect to login after successful password reset
      alert(
        'Password reset successful! You can now log in with your new password.'
      );
      router.push('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleAction = async () => {
      setLoading(true);
      try {
        switch (actionMode) {
          case 'resetPassword':
            // Verify the password reset code and retrieve the associated email
            const email = await verifyPasswordResetCode(auth, actionCode);
            setEmail(email); // Pre-fill the email input field
            break;
          case 'verifyEmail':
            await applyActionCode(auth, actionCode);
            setVerificationStatus('Email verified successfully! Please login');

            // Redirect to booking or home after successful verification
            const redirectTo = localStorage.getItem('redirectTo') || '';
            localStorage.removeItem('redirectTo');
            setTimeout(() => {
              router.push(
                redirectTo ? `/login/redirectTo=${redirectTo}` : '/login'
              );
            }, 2000);
            break;
          default:
          // Error: invalid mode.
        }
      } catch (err) {
        setError(
          err.message || 'Invalid or expired action code. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    handleAction();
  }, [actionMode, actionCode, router]);

  if (actionMode === '') {
    router.replace('/');
    return null;
  }

  return (
    <AuthLayout>
      {loading && (
        <div className="min-h-screen flex justify-center items-center fixed inset-0">
          <Spinner
            spinnerColor="text-primary"
            spinnerHeight="h-1/5"
            spinnerWidth="w-1/5"
          />
        </div>
      )}

      {!loading && actionMode === 'resetPassword' && (
        <Container classes="my-8">
          <HeadingOne>Reset your password</HeadingOne>
          <div className="text-primary text-xl mb-3">Choose a new password</div>
          <div className="mb-8">Enter a new password</div>
          <form onSubmit={handlePasswordReset}>
            <div className="mb-8">
              <label className="block">Email Address</label>
              <input
                type="email"
                className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400 read-only:opacity-80 read-only:bg-neutral-100 read-only:cursor-not-allowed read-only:focus-visible:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly
              />
            </div>
            <div className="mb-8">
              <label className="block">New Password</label>
              <input
                type="password"
                className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div>
                <Link href="/reset-password" className="text-xl">
                  Get a new reset password link
                </Link>
              </div>
            )}
            <div className="*:w-full">
              <StyledButton btnText="Submit" isSubmitBtn={true} />
            </div>
          </form>
          {/* {loading && (
            <div className="min-h-screen flex justify-center items-center max-w-screen-lg mx-auto fixed inset-0">
              <Spinner
                spinnerColor="text-primary"
                spinnerHeight="h-1/5"
                spinnerWidth="w-1/5"
              />
            </div>
          )} */}
        </Container>
      )}
      {!loading && actionMode === 'verifyEmail' && (
        <Container className="my-8">
          <HeadingOne>Email Verification</HeadingOne>
          <p className="text-2xl">{verificationStatus}</p>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </Container>
      )}
    </AuthLayout>
  );
};

export default AuthManager;
