/**
 * LemonFox Audio Library
 * Handles text-to-speech conversion and audio playback
 * 
 * - Convert text to audio via LemonFox API
 * - Play audio using HTML5 Audio API
 * - Queue audio playback for streaming responses
 * - Handle audio interruption when user speaks
 */

import { CONFIG } from './config';
import { logger } from './logger';

interface TTSOptions {
  voice?: string;
  language?: string;
  response_format?: string;
  speed?: number;
  useEU?: boolean;
}

let audioQueue: Array<{
  id: string;
  audio: HTMLAudioElement;
  promise: Promise<void>;
}> = [];
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

/**
 * Convert text to speech using LemonFox API
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Blob> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text');
    }

    logger.info('Converting text to speech', {
      textLength: text.length,
      voice: options.voice || CONFIG.LEMONFOX_DEFAULT_VOICE,
    });

    const response = await fetch(CONFIG.LEMONFOX_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: options.voice || CONFIG.LEMONFOX_DEFAULT_VOICE,
        language: options.language || CONFIG.LEMONFOX_LANGUAGE,
        response_format: options.response_format || CONFIG.LEMONFOX_RESPONSE_FORMAT,
        speed: options.speed || CONFIG.LEMONFOX_SPEED,
        useEU: options.useEU || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `TTS API error: ${response.status}`
      );
    }

    const audioBlob = await response.blob();
    logger.debug('Audio blob created', { size: audioBlob.size });

    return audioBlob;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error converting text to speech', { message });
    throw error;
  }
}

/**
 * Create audio element from blob
 */
function createAudioElement(blob: Blob): HTMLAudioElement {
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };
  return audio;
}

/**
 * Play audio and return promise that resolves when done
 */
export async function playAudio(audio: HTMLAudioElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const handleEnded = () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      isPlaying = false;
      resolve();
    };

    const handleError = () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      isPlaying = false;
      reject(new Error('Audio playback error'));
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    try {
      isPlaying = true;
      void audio.play().catch(reject);
    } catch (err) {
      isPlaying = false;
      reject(err);
    }
  });
}

/**
 * Queue audio for playback and wait for all to complete
 */
export async function queueAndPlayAudio(blob: Blob, id?: string): Promise<void> {
  try {
    const audio = createAudioElement(blob);
    const audioId = id || `audio-${Date.now()}-${Math.random()}`;

    logger.info('Queueing audio for playback', { audioId, size: blob.size });

    // Create promise for this audio
    const promise = playAudio(audio)
      .then(() => {
        logger.debug('Audio playback completed', { audioId });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Audio playback error', { audioId, message });
        // Don't throw, just log and continue to next audio
      });

    // Add to queue
    audioQueue.push({ id: audioId, audio, promise });

    // If nothing is playing, play this immediately
    if (!isPlaying) {
      await promise;

      // Remove from queue
      audioQueue = audioQueue.filter(item => item.id !== audioId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error queuing audio', { message });
    throw error;
  }
}

/**
 * Play text immediately (blocking)
 */
export async function playText(
  text: string,
  options: TTSOptions = {}
): Promise<void> {
  try {
    const blob = await textToSpeech(text, options);
    await queueAndPlayAudio(blob);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error playing text', { message });
    throw error;
  }
}

/**
 * Stop all audio playback and clear queue
 */
export function stopAllAudio(): void {
  logger.info('Stopping all audio playback');

  // Stop current audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Stop queued audio
  audioQueue.forEach(item => {
    item.audio.pause();
    item.audio.currentTime = 0;
  });

  // Clear queue
  audioQueue = [];
  isPlaying = false;
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return isPlaying || audioQueue.length > 0;
}

/**
 * Wait for all queued audio to finish
 */
export async function waitForAudioQueue(): Promise<void> {
  if (audioQueue.length === 0) {
    return;
  }

  logger.info('Waiting for audio queue', { count: audioQueue.length });

  const promises = audioQueue.map(item => item.promise);
  await Promise.allSettled(promises);

  audioQueue = [];
}

/**
 * Clear audio queue (without waiting)
 */
export function clearAudioQueue(): void {
  logger.info('Clearing audio queue');
  audioQueue = [];
  isPlaying = false;
}

/**
 * Get audio queue status
 */
export function getAudioQueueStatus() {
  return {
    isPlaying,
    queueLength: audioQueue.length,
    totalSize: audioQueue.reduce((sum, item) => {
      // Estimate size from duration if possible
      return sum + (item.audio.duration || 0);
    }, 0),
  };
}
