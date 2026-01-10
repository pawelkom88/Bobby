'use client';

import { useEffect } from 'react';
import { ViewTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const tLoading = useTranslations('loading');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      // Store the intended destination with query parameters preserved
      const redirectPath =
        pathname +
        (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const redirectUrl = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectPath)}`;
      router.push(redirectUrl);
    }
  }, [user, loading, router, pathname, searchParams]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <LoadingSpinner
        text={tLoading('generic')}
        heading={tLoading('heading')}
      />
    );
  }

  // If not authenticated, show loading while redirect happens
  if (!user) {
    return (
      <ViewTransition>
        <LoadingSpinner
          text={tLoading('signingOut')}
          heading={tLoading('heading')}
        />
      </ViewTransition>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
