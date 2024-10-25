'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

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
      return (
        <div className="min-h-screen pb-5 md:pb-10 lg:pb-20 px-5 md:px-10 lg:px-28 font-[family-name:var(--font-manrope)] max-w-screen-lg mx-auto">
          <div className="text-2xl font-medium">Loading...</div>
        </div>
      );
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
