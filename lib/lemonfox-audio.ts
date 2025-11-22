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
  logger.debug('Created audio element', { 
    blobSize: blob.size, 
    blobType: blob.type,
    url: audioUrl 
  });
  
  const audio = new Audio(audioUrl);
  audio.preload = 'auto'; // Ensure audio is preloaded
  
  // Add detailed event listeners for debugging
  audio.addEventListener('loadstart', () => logger.debug('Audio loadstart'));
  audio.addEventListener('loadedmetadata', () => logger.debug('Audio loadedmetadata', { duration: audio.duration }));
  audio.addEventListener('loadeddata', () => logger.debug('Audio loadeddata'));
  audio.addEventListener('canplay', () => logger.debug('Audio canplay'));
  audio.addEventListener('canplaythrough', () => logger.debug('Audio canplaythrough'));
  
  audio.onended = () => {
    logger.debug('Audio onended cleanup, revoking URL', { url: audioUrl });
    URL.revokeObjectURL(audioUrl);
  };
  
  return audio;
}

/**
 * Play audio and return promise that resolves when done
 */
export async function playAudio(audio: HTMLAudioElement): Promise<void> {
  logger.debug('playAudio called', { 
    duration: audio.duration, 
    readyState: audio.readyState,
    paused: audio.paused 
  });
  
  return new Promise((resolve, reject) => {
    const handleEnded = () => {
      logger.debug('Audio ended event fired');
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
      isPlaying = false;
      currentAudio = null;
      resolve();
    };

    const handleError = (event: any) => {
      logger.error('Audio error event fired', { error: event });
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
      isPlaying = false;
      currentAudio = null;
      reject(new Error('Audio playback error'));
    };

    const handlePause = () => {
      logger.debug('Audio paused event fired', { currentTime: audio.currentTime, duration: audio.duration });
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('pause', handlePause);

    // Log when audio starts playing
    audio.addEventListener('play', () => {
      logger.debug('Audio play event fired');
    }, { once: true });

    audio.addEventListener('playing', () => {
      logger.debug('Audio playing event fired (actually started)');
    }, { once: true });

    try {
      isPlaying = true;
      currentAudio = audio;
      logger.debug('Calling audio.play()');
      
      audio.play()
        .then(() => {
          logger.debug('audio.play() promise resolved');
        })
        .catch((err) => {
          logger.error('audio.play() promise rejected', { error: err.message });
          isPlaying = false;
          currentAudio = null;
          reject(err);
        });
    } catch (err) {
      logger.error('Exception calling audio.play()', { error: err });
      isPlaying = false;
      currentAudio = null;
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

    logger.info('Queueing audio for playback', { 
      audioId, 
      size: blob.size,
      isCurrentlyPlaying: isPlaying,
      queueLength: audioQueue.length
    });

    // Create promise for this audio
    const promise = playAudio(audio)
      .then(() => {
        logger.info('Audio playback completed', { audioId });
        // Remove from queue after completion
        audioQueue = audioQueue.filter(item => item.id !== audioId);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('Audio playback error', { audioId, message });
        // Remove from queue on error too
        audioQueue = audioQueue.filter(item => item.id !== audioId);
        throw error; // Re-throw so caller knows it failed
      });

    // Add to queue
    audioQueue.push({ id: audioId, audio, promise });
    
    logger.debug('Audio added to queue', { 
      audioId,
      queueLength: audioQueue.length,
      willPlayImmediately: !isPlaying
    });

    // Always await the promise to ensure audio plays before returning
    logger.debug('Awaiting audio playback', { audioId });
    await promise;
    logger.debug('Audio playback await completed', { audioId });
    
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
