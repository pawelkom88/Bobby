/**
 * Gemini Conversation Library
 * Handles real-time conversation with Gemini AI backend
 * 
 * - Initialize session with system prompt
 * - Stream user messages to Gemini
 * - Track session time and enforce timeout
 * - Manage conversation history
 */

import { CONFIG } from './config';
import { logger } from './logger';
import type { ConversationMessage } from '@/types';

export interface GeminiSessionOptions {
  ageTier: 1 | 2 | 3;
  scenario: 'fire' | 'ambulance' | 'police';
}

export interface GeminiSession {
  startTime: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  ageTier: 1 | 2 | 3;
  scenario: 'fire' | 'ambulance' | 'police';
}

let activeSession: GeminiSession | null = null;

/**
 * Start a new Gemini conversation session
 */
export function startGeminiSession(options: GeminiSessionOptions): GeminiSession {
  logger.info('Starting Gemini conversation session', options);

  activeSession = {
    startTime: Date.now(),
    messages: [],
    ageTier: options.ageTier,
    scenario: options.scenario,
  };

  return activeSession;
}

/**
 * Check if current session is still valid (within time limit)
 */
export function isSessionValid(): boolean {
  if (!activeSession) {
    return false;
  }

  const now = Date.now();
  const elapsedSeconds = (now - activeSession.startTime) / 1000;
  const isValid = elapsedSeconds < CONFIG.SESSION_MAX_DURATION_SECONDS;

  if (!isValid) {
    logger.info('Session expired', {
      elapsedSeconds,
      maxDuration: CONFIG.SESSION_MAX_DURATION_SECONDS,
    });
  }

  return isValid;
}

/**
 * Get remaining session time in seconds
 */
export function getRemainingSessionTime(): number {
  if (!activeSession) {
    return 0;
  }

  const now = Date.now();
  const elapsedSeconds = (now - activeSession.startTime) / 1000;
  const remaining = CONFIG.SESSION_MAX_DURATION_SECONDS - elapsedSeconds;

  return Math.max(0, Math.round(remaining));
}

/**
 * Send message to Gemini and stream response
 */
export async function sendMessageToGemini(
  userMessage: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void | Promise<void>,
  onError: (error: string) => void
): Promise<void> {
  try {
    if (!activeSession) {
      throw new Error('No active session');
    }

    if (!isSessionValid()) {
      throw new Error('Session time limit exceeded');
    }

    logger.info('Sending message to Gemini', { messageLength: userMessage.length });

    // Add user message to history (only if not empty - empty is for initial greeting)
    if (userMessage && userMessage.trim().length > 0) {
      activeSession.messages.push({
        role: 'user',
        content: userMessage,
      });
    }

    // Call backend API with streaming
    const response = await fetch(CONFIG.GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: activeSession.messages,
        ageTier: activeSession.ageTier,
        scenario: activeSession.scenario,
        sessionStartTime: activeSession.startTime,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || `API error: ${response.status}`;
      const errorDetails = errorData.details || '';
      throw new Error(
        errorDetails ? `${errorMessage} (${errorDetails})` : errorMessage
      );
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    // Stream response chunks
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        // Call callback for each chunk
        onChunk(chunk);
      }

      // Handle final decoder state
      const finalChunk = decoder.decode();
      if (finalChunk) {
        fullResponse += finalChunk;
        onChunk(finalChunk);
      }

      logger.debug('Gemini response complete', {
        responseLength: fullResponse.length,
      });

      // Add assistant response to history
      activeSession.messages.push({
        role: 'assistant',
        content: fullResponse,
      });

      // Await onComplete if it returns a promise (for audio playback)
      logger.debug('Calling onComplete callback');
      await onComplete(fullResponse);
      logger.debug('onComplete callback finished');
    } catch (streamError) {
      const message =
        streamError instanceof Error ? streamError.message : String(streamError);
      logger.error('Error reading response stream', { message });
      throw streamError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    logger.error('Error sending message to Gemini', { message, stack });
    onError(message);
    throw error;
  }
}

/**
 * Get current session conversation history
 */
export function getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!activeSession) {
    return [];
  }

  return [...activeSession.messages];
}

/**
 * Convert Gemini messages to ConversationMessage format
 */
export function convertToConversationMessages(): ConversationMessage[] {
  if (!activeSession) {
    return [];
  }

  return activeSession.messages.map((msg) => ({
    type: msg.role === 'user' ? 'user' : 'agent',
    text: msg.content,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * End the current session
 */
export function endGeminiSession(): void {
  if (activeSession) {
    logger.info('Ending Gemini session', {
      messageCount: activeSession.messages.length,
      durationSeconds:
        (Date.now() - activeSession.startTime) / 1000,
    });
  }
  activeSession = null;
}

/**
 * Get active session info
 */
export function getActiveSession(): GeminiSession | null {
  return activeSession;
}

/**
 * Get session statistics
 */
export function getSessionStats() {
  if (!activeSession) {
    return null;
  }

  const now = Date.now();
  const durationSeconds = (now - activeSession.startTime) / 1000;
  const messageCount = activeSession.messages.length;

  return {
    durationSeconds: Math.round(durationSeconds),
    messageCount,
    remainingTimeSeconds: getRemainingSessionTime(),
    ageTier: activeSession.ageTier,
    scenario: activeSession.scenario,
  };
}
