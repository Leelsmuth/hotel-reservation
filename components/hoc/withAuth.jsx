'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import LoadingState from '../ui/LoadingState';

const withAuth = (WrappedComponent) => {
  // Create a new component with authentication
  const ComponentWithAuth = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
        // router.push({
        //   pathname: '/login',
        //   query: { from: router.asPath }, // Redirect to login with the original path saved
        // });
      }
    }, [user, loading, router]);

    if (loading) {
      return <LoadingState label="Loading your account…" className="min-h-[60vh]" />;
    }

    return user ? <WrappedComponent {...props} /> : null;
  };

  // Set a display name for easier debugging
  ComponentWithAuth.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithAuth;
};

export default withAuth;
