'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { SoundProvider } from '@/components/SoundProvider';
import { MicrophoneContextProvider } from '@/context/MicrophoneContextProvider';
import { DeepgramContextProvider } from '@/context/DeepgramContextProvider';
import { AuthProvider } from '@/context/AuthContext';
import { UserDataProvider } from '@/context/UserDataContext';
import { CreditsProvider } from '@/context/CreditsContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CreditsProvider>
          <UserDataProvider>
            <SoundProvider>
              <DeepgramContextProvider>
                <MicrophoneContextProvider>{children}</MicrophoneContextProvider>
              </DeepgramContextProvider>
            </SoundProvider>
          </UserDataProvider>
        </CreditsProvider>
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
