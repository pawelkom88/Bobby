'use client';

import { SoundProvider } from '@/components/SoundProvider';
import { MicrophoneContextProvider } from '@/context/MicrophoneContextProvider';
import { DeepgramContextProvider } from '@/context/DeepgramContextProvider';
import { AuthProvider } from '@/context/AuthContext';
import { UserDataProvider } from '@/context/UserDataContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserDataProvider>
        <SoundProvider>
          <DeepgramContextProvider>
            <MicrophoneContextProvider>{children}</MicrophoneContextProvider>
          </DeepgramContextProvider>
        </SoundProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}
