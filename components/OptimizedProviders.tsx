'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SoundProvider } from '@/components/SoundProvider';
import { MicrophoneContextProvider } from '@/context/MicrophoneContextProvider';
import { AuthProvider } from '@/context/AuthContext';
import { UserDataProvider } from '@/context/UserDataContext';
import { CreditsProvider } from '@/context/CreditsContext';
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
    pathname?.includes('/conversation') || pathname?.includes('/dial');

  return (
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
  );
}
