'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { CookiesProvider } from 'react-cookie';
import { SoundProvider } from '@/components/SoundProvider';
import { MicrophoneContextProvider } from '@/context/MicrophoneContextProvider';
import { AuthProvider } from '@/context/AuthContext';
import { UserDataProvider } from '@/context/UserDataContext';
import { CreditsProvider } from '@/context/CreditsContext';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import CookieBanner from '@/components/CookieBanner';
import { initWebVitals } from '@/lib/web-vitals';
import { queryClient } from '@/lib/queryClient';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

const DeepgramContextProvider = dynamic(
  () =>
    import('@/context/DeepgramContextProvider').then(mod => ({
      default: mod.DeepgramContextProvider,
    })),
  {
    ssr: false,
    loading: () => <LoadingSpinner text="Loading..." />,
  }
);

interface ProvidersProps {
  children: ReactNode;
}

export function OptimizedProviders({ children }: ProvidersProps) {
  const pathname = usePathname();

  const isConversationPage =
    pathname
      ? [
          '/app/conversation',
          '/app/dial',
          '/aplikacja/rozmowa',
          '/aplikacja/wybierz',
        ].some(fragment => pathname.includes(fragment))
      : false;

  // Initialize Web Vitals monitoring
  useEffect(() => {
    initWebVitals();
  }, []);

  return (
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <ServiceWorkerRegistration />
        <AuthProvider>
          <CreditsProvider>
            <UserDataProvider>
              <SoundProvider>
                {isConversationPage ? (
                  <DeepgramContextProvider>
                    <MicrophoneContextProvider>
                      {children}
                    </MicrophoneContextProvider>
                  </DeepgramContextProvider>
                ) : (
                  <MicrophoneContextProvider>{children}</MicrophoneContextProvider>
                )}
              </SoundProvider>
            </UserDataProvider>
          </CreditsProvider>
        </AuthProvider>
        <CookieBanner />
      </QueryClientProvider>
    </CookiesProvider>
  );
}
