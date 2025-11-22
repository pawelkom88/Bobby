'use client';

import { SoundProvider } from '@/components/SoundProvider';
import { MicrophoneContextProvider } from '@/context/MicrophoneContextProvider';
import { DeepgramContextProvider } from '@/context/DeepgramContextProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SoundProvider>
      <DeepgramContextProvider>
        <MicrophoneContextProvider>
          {children}
        </MicrophoneContextProvider>
      </DeepgramContextProvider>
    </SoundProvider>
  );
}

