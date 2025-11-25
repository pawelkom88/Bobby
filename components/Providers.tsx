'use client';

import { SoundProvider } from '@/components/SoundProvider';
import { MicrophoneContextProvider } from '@/context/MicrophoneContextProvider';
import { DeepgramContextProvider } from '@/context/DeepgramContextProvider';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SoundProvider>
        <DeepgramContextProvider>
          <MicrophoneContextProvider>{children}</MicrophoneContextProvider>
        </DeepgramContextProvider>
      </SoundProvider>
    </AuthProvider>
  );
}
