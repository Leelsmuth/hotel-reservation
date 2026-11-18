'use client';

import AuthLayout from '@/components/layout/AuthLayout';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/authClient';
import { TextField } from '@/components/forms/Field';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthProvider';

// Firebase errors meaning the reset link itself is no good
const LINK_ERROR_CODES = [
  'auth/expired-action-code',
  'auth/invalid-action-code',
];

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
        handleError(
          err.message || 'Failed to reset password. Please try again.'
        );
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
              const email =
                await authClient.verifyPasswordResetCode(actionCode);
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
        <LoadingState
          label={
            actionMode === 'verifyEmail'
              ? 'Verifying your email…'
              : 'Checking your link…'
          }
          className="min-h-[40vh]"
        />
      )}

      {!loading && actionMode === 'resetPassword' && (
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Choose a new password
          </h1>
          <p className="mb-8 mt-2 text-ink-600">
            Enter a new password for your account.
          </p>
          <form onSubmit={handlePasswordReset} className="space-y-5">
            {error && (
              <Alert
                tone="error"
                action={
                  linkInvalid && (
                    <Button
                      href="/reset-password"
                      size="sm"
                      variant="secondary"
                    >
                      Get a new reset link
                    </Button>
                  )
                }
              >
                {error}
              </Alert>
            )}
            <TextField
              id="new-password-email"
              label="Email address"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly
            />
            <TextField
              id="new-password"
              label="New password"
              type="password"
              autoComplete="new-password"
              hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" size="lg" fullWidth>
              Save new password
            </Button>
          </form>
        </div>
      )}
      {!loading && actionMode === 'verifyEmail' && (
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Email verification
          </h1>
          <div className="mt-6 space-y-4">
            {error ? (
              <Alert tone="error">{error}</Alert>
            ) : (
              <Alert
                tone={
                  verificationStatus.startsWith('Email verified')
                    ? 'success'
                    : 'info'
                }
              >
                {verificationStatus}
              </Alert>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default AuthManager;
