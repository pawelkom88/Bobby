/**
 * Web Speech API wrapper for speech-to-text functionality
 */

import type { SpeechRecognitionResult } from '@/types';
import {logger} from "@/lib/logger";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultItem {
  length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: {
    new (): SpeechRecognition;
  };
  webkitSpeechRecognition?: {
    new (): SpeechRecognition;
  };
}

interface SpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  maxAlternatives?: number;
}

interface SpeechRecognitionCallbacks {
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string | Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * Check if Web Speech API is available
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const win = window as WindowWithSpeechRecognition;
  return 'webkitSpeechRecognition' in win || 'SpeechRecognition' in win;
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    logger.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Create a speech recognition instance
 */
export function createSpeechRecognition(
  options: SpeechRecognitionOptions = {}
): SpeechRecognition | null {
  if (!isSpeechRecognitionAvailable()) {
    return null;
  }

  const win = window as WindowWithSpeechRecognition;
  const SpeechRecognition =
    win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return null;
  }

  const recognition = new SpeechRecognition();

  // Default options
  recognition.continuous = options.continuous ?? true;
  recognition.interimResults = options.interimResults ?? true;
  recognition.lang = options.lang || 'en-GB';
  recognition.maxAlternatives = options.maxAlternatives || 1;

  return recognition;
}

/**
 * Start speech recognition
 */
export function startSpeechRecognition(
  recognition: SpeechRecognition | null,
  callbacks: SpeechRecognitionCallbacks = {}
): () => void {
  if (!recognition) {
    logger.error('Speech recognition not available');
    return () => {};
  }

  const { onResult, onError, onStart, onEnd } = callbacks;

  // Handle results
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    if (onResult) {
      onResult({
        final: finalTranscript.trim(),
        interim: interimTranscript,
      });
    }
  };

  // Handle errors
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    logger.error('Speech recognition error:', event.error);
    if (onError) {
      onError(event.error);
    }
  };

  // Handle start
  recognition.onstart = () => {
    if (onStart) {
      onStart();
    }
  };

  // Handle end
  recognition.onend = () => {
    if (onEnd) {
      onEnd();
    }
  };

  // Start recognition
  try {
    recognition.start();
  } catch (error) {
    logger.error('Error starting speech recognition:', error);
    if (onError) {
      onError(error as Error);
    }
  }

  // Return stop function
  return () => {
    try {
      recognition.stop();
    } catch (error) {
      logger.error('Error stopping speech recognition:', error);
    }
  };
}

/**
 * Stop speech recognition
 */
export function stopSpeechRecognition(
  recognition: SpeechRecognition | null
): void {
  if (!recognition) {
    return;
  }

  try {
    recognition.stop();
  } catch (error) {
    logger.error('Error stopping speech recognition:', error);
  }
}
