'use client';

import Spinner from '@/components/anim/Spinner';
import Container from '@/components/layout/Container';
import StyledButton from '@/components/ui/StyledButton';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ResetPassword = () => {
  const router = useRouter();
  const { initiatePasswordReset, loading, user } = useAuth();

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
      alert('Password reset email has been sent. Please check your inbox.');
      router.push('login');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    if (user) {
      router.push('/account');
    }
  }, [user, router]);

  if (user || loading)
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
    <Container>
      <h1>Reset Password</h1>
      <form onSubmit={handlePasswordReset}>
        <div>
          <label className="block">Email Address</label>
          <input
            type="email"
            className="border w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {message && <p style={{ color: 'green' }}>{message}</p>}
        <div>
          <StyledButton btnText="Reset password" isSubmitBtn={true} />
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
  );
};

export default ResetPassword;
