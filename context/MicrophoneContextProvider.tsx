'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {logger} from "@/lib/logger";

interface MicrophoneContextType {
  microphone: MediaStreamAudioSourceNode | null;
  startMicrophone: () => void;
  setupMicrophone: () => Promise<void>;
  microphoneState: number | null; // null=not setup, 0=setting up, 1=ready, 2=open
  microphoneError: string | null;
  microphoneAudioContext: AudioContext | undefined;
  processor: AudioWorkletNode | undefined;
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined
);

export const MicrophoneContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [microphoneState, setMicrophoneState] = useState<number | null>(null);
  const [microphone, setMicrophone] =
    useState<MediaStreamAudioSourceNode | null>(null);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [microphoneAudioContext, setMicrophoneAudioContext] = useState<
    AudioContext | undefined
  >(undefined);
  const [processor, setProcessor] = useState<AudioWorkletNode | undefined>(
    undefined
  );

  const setupMicrophone = async () => {
    setMicrophoneState(0); // Setting up
    setMicrophoneError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      await audioContext.audioWorklet.addModule('/worklets/mic-processor.js');

      const micSource = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'mic-processor');

      setMicrophone(micSource);
      setMicrophoneAudioContext(audioContext);
      setProcessor(workletNode);
      setMicrophoneState(1); // Ready
    } catch (err) {
      logger.error('Error setting up microphone:', err);
      setMicrophoneState(null);
      setMicrophoneError(err instanceof Error ? err.message : String(err));
    }
  };

  const startMicrophone = useCallback(() => {
    if (microphone && processor && microphoneAudioContext) {
      microphone.connect(processor);
      processor.connect(microphoneAudioContext.destination);
      setMicrophoneState(2); // Open
    }
  }, [microphone, processor, microphoneAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (microphoneAudioContext) {
        microphoneAudioContext.close();
      }
      if (microphone) {
        microphone.disconnect();
      }
      if (processor) {
        processor.disconnect();
      }
    };
  }, []);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        setupMicrophone,
        microphoneState,
        microphoneError,
        microphoneAudioContext,
        processor,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

export function useMicrophone() {
  const context = useContext(MicrophoneContext);
  if (context === undefined) {
    throw new Error(
      'useMicrophone must be used within a MicrophoneContextProvider'
    );
  }
  return context;
}
