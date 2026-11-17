'use client';

import AuthLayout from '@/components/layout/AuthLayout';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/authClient';
import Container from '@/components/layout/Container';
import Link from 'next/link';
import Spinner from '@/components/anim/Spinner';
import HeadingOne from '@/components/typography/HeadingOne';
import StyledButton from '@/components/ui/StyledButton';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthProvider';

// Firebase errors meaning the reset link itself is no good
const LINK_ERROR_CODES = ['auth/expired-action-code', 'auth/invalid-action-code'];

const AuthManager = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionMode = searchParams.get('mode') || '';
  const actionCode = searchParams.get('oobCode') || '';
  const { initiatePasswordReset } = useAuth();

  const { showToast, removeToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // The reset link itself is expired/invalid (vs. e.g. a too-weak password)
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('Verifying...');

  const errorToastId = useRef(null);
  // The link's action already started for this mode/code (see effect below)
  const handledAction = useRef(null);

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

  // The error toast with an action stays until used: keep at most one and
  // remove it when leaving the page
  const dismissErrorToast = () => {
    if (errorToastId.current) {
      removeToast(errorToastId.current);
      errorToastId.current = null;
    }
  };

  useEffect(() => dismissErrorToast, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleErrorAction = (error, actionLabel, actionFxn) => {
    dismissErrorToast();
    errorToastId.current = showToast(error, 'error', {
      action: actionFxn,
      actionLabel: actionLabel,
      autoClose: false,
    });
  };

  /**
   * "Get New Link". If we know whose link it was, email them a new one.
   * If the link was invalid from the start we don't know the email, so ask
   * for it on /reset-password (this used to send a reset to an empty email).
   */
  const requestNewResetLink = async (knownEmail) => {
    dismissErrorToast();

    if (!knownEmail) {
      router.push('/reset-password');
      return;
    }

    try {
      await initiatePasswordReset(knownEmail);
      handleSuccess('Password reset link resent! Check inbox/junk');
      router.replace('/');
    } catch (err) {
      handleError(
        err.message || 'Could not send a new reset link. Please try again.'
      );
    }
  };

  const showInvalidLink = (knownEmail) => {
    setLinkInvalid(true);
    setError('This password reset link has expired or has already been used.');
    handleErrorAction(
      'This reset link has expired. Get a new one?',
      'Get New Link',
      () => requestNewResetLink(knownEmail)
    );
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authClient.confirmPasswordReset(actionCode, password);

      dismissErrorToast();
      handleSuccess(
        'Password reset successful! You can now log in with your new password.'
      );
      router.replace('/login');
    } catch (err) {
      if (LINK_ERROR_CODES.includes(err.code)) {
        showInvalidLink(email);
      } else {
        // e.g. a too-weak password: the link still works, just try again
        setError(err.message || 'Failed to reset password. Please try again.');
        handleError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Action codes are single-use, so the action must run once per link. React
    // StrictMode runs effects twice in development: the second
    // applyActionCode() failed on the already-used code and redirected to "/".
    const actionKey = `${actionMode}:${actionCode}`;
    if (handledAction.current === actionKey) return;
    handledAction.current = actionKey;

    const handleAction = async () => {
      setLoading(true);
      try {
        switch (actionMode) {
          case 'resetPassword':
            try {
              const email = await authClient.verifyPasswordResetCode(actionCode);
              setEmail(email);
            } catch (err) {
              // We don't know whose link this was, so "Get New Link" asks
              // for the email address
              showInvalidLink(null);
            }
            break;
          case 'verifyEmail':
            try {
              await authClient.applyActionCode(actionCode);
              setVerificationStatus(
                'Email verified successfully! Please login'
              );
              handleSuccess('Email verified successfully! Please login');

              const redirectTo = localStorage.getItem('redirectTo') || '';
              localStorage.removeItem('redirectTo');
              setTimeout(() => {
                router.replace(
                  redirectTo
                    ? `/login?redirectTo=${encodeURIComponent(redirectTo)}`
                    : '/login'
                );
              }, 2000);
            } catch (err) {
              setError(
                err.message ||
                  'Invalid or expired verification code. Please try again.'
              );
              handleError('Something went wrong. Please try again');
              router.replace('/');
            }
            break;
          default:
            handleError('Invalid action mode. Redirecting...');
            router.replace('/');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <p role="alert" className="mb-4 text-red-600">
                {error}
              </p>
            )}
            {linkInvalid && (
              <div className="mb-4">
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
