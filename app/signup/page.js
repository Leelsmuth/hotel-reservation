'use client';

import Spinner from '@/components/anim/Spinner';
import AuthLayout from '@/components/layout/AuthLayout';
import Container from '@/components/layout/Container';
import HeadingOne from '@/components/typography/HeadingOne';
import StyledButton from '@/components/ui/StyledButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SignUp = () => {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (event) => {
    event.preventDefault();
    setError('');

    // if (password.trim() !== confirmPassword.trim()) {
    //   setError('Password and Confirm password must match');
    //   return;
    // }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password: password.trim(),
          phone: phone.trim(),
          country: country.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Signup successful!');
        router.push('/login');
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthLayout classes="my-8">
      <Container>
        <HeadingOne classes="mb-10 text-center">Create Account</HeadingOne>
        <form onSubmit={handleSignup}>
          <div className="mb-8">
            <label className="block">Name</label>
            <input
              type="text"
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block">Email</label>
            <input
              type="email"
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block">Phone No</label>
            <input
              type="text"
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block">Country</label>
            <input
              type="text"
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
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
          {/* <div className="mb-8">
            <label className="block">Confirm Password</label>
            <input
              type="password"
              className="border w-full text-xl px-5 py-4 rounded-xl border-gray-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div> */}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div className="mb-1 text-base text-center">
            By signing up you agree to our{' '}
            <span class="text-primary">terms and conditions</span>.
          </div>
          <div className="*:w-full">
            <StyledButton btnText="Register" isSubmitBtn={true} />
          </div>
        </form>
        <div className="text-center mt-4">
          <Link href="/login" className="text-xl underline">
            Login
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

export default SignUp;
