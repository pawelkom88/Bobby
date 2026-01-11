'use client';

import { ReactNode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { CookiesProvider } from 'react-cookie';
import { SoundProvider } from '@/components/SoundProvider';
import { MicrophoneContextProvider } from '@/context/MicrophoneContextProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import CookieBanner from '@/components/CookieBanner';
import { AnalyticsConsent } from '@/components/AnalyticsConsent';
import { initWebVitals } from '@/lib/web-vitals';
import { queryClient } from '@/lib/queryClient';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import React from 'react';
import { AuthProvider } from '@/context/AuthContext';

// Lazy load analytics to prevent Firebase from loading on landing page
const LazyAnalyticsInitializer = dynamic(
  () =>
    import('@/lib/analytics-lazy').then(mod => ({
      default: function LazyAnalyticsInit() {
        React.useEffect(() => {
          mod.lazyAnalytics.initialize();
        }, []);
        return null;
      },
    })),
  {
    ssr: false,
  }
);

interface ProvidersProps {
  children: ReactNode;
}

export function OptimizedProviders({ children }: ProvidersProps) {
  useEffect(() => {
    initWebVitals();
  }, []);

  return (
    <CookiesProvider>
      <AnalyticsConsent />
      <LazyAnalyticsInitializer />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ServiceWorkerRegistration />
          <SoundProvider>
            <MicrophoneContextProvider>{children}</MicrophoneContextProvider>
          </SoundProvider>
          <CookieBanner />
        </AuthProvider>
      </QueryClientProvider>
    </CookiesProvider>
  );
}
