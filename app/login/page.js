'use client';

import Spinner from '@/components/anim/Spinner';
import Container from '@/components/layout/Container';
import StyledButton from '@/components/ui/StyledButton';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Login = () => {
  const router = useRouter();
  const { login, loading, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(email, password);

      router.push('/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <Container>
      <h1>SignIn</h1>
      <form onSubmit={handleSignin}>
        <div className="mb-3">
          <label className="block">Email Address</label>
          <input
            type="email"
            className="border w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block">Password</label>
          <input
            type="password"
            className="border w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div>
          <StyledButton btnText="Sign In" isSubmitBtn={true} />
        </div>
      </form>
      <div className="mt-3">
        <Link href="/reset-password">Forgot Password?</Link>
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
  );
};

export default Login;
