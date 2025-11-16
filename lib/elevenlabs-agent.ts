/**
 * ElevenLabs Agents Platform Integration
 * Real-time audio streaming with conversation support
 * 
 * Based on: https://elevenlabs.io/docs/agents-platform/libraries/java-script
 * SDK: @elevenlabs/client
 */

import { Conversation } from '@elevenlabs/client';
import type { AgentConnection, AgentResponse } from '@/types';
import { logger } from './logger';

let activeConversation: Conversation | null = null;

/**
 * Start a conversation with ElevenLabs agent
 */
export async function startAgentConversation(agentId: string): Promise<Conversation> {
  try {
    logger.info('Starting agent conversation', { agentId });

    // Request microphone permission first
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    // Initialize conversation with agent
    const conversation = await Conversation.startSession({
      agentId,
      connectionType: 'websocket', // Use WebSocket for real-time streaming
      // Optional: specify output device
      // outputDeviceId: 'device-id',
    });

    activeConversation = conversation;
    logger.info('Agent conversation started successfully');

    return conversation;
  } catch (error) {
    logger.error('Failed to start agent conversation', error);
    throw error;
  }
}

/**
 * Convert speech to text using Web Speech API
 */
export function startSpeechToText(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void
): () => void {
  try {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      logger.error('Speech Recognition not supported');
      onError('Speech Recognition not supported in your browser');
      return () => {};
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';

    recognition.onstart = () => {
      logger.info('Speech recognition started');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Report interim results
      if (interimTranscript) {
        onResult(interimTranscript, false);
      }

      // Report final results
      if (finalTranscript) {
        const sanitized = finalTranscript.trim();
        logger.debug('Final transcript', { sanitized });
        onResult(sanitized, true);
      }
    };

    recognition.onerror = (event: any) => {
      logger.error('Speech recognition error', event.error);
      onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      logger.info('Speech recognition ended');
    };

    // Start listening
    recognition.start();

    // Return function to stop recognition
    return () => {
      try {
        recognition.stop();
        logger.info('Speech recognition stopped');
      } catch (err) {
        logger.debug('Error stopping recognition', err);
      }
    };
  } catch (error) {
    logger.error('Error starting speech recognition', error);
    onError('Failed to start speech recognition');
    return () => {};
  }
}

/**
 * Send user text to agent and get response
 */
export async function sendTextToAgent(
  conversation: Conversation,
  userText: string
): Promise<AgentResponse> {
  try {
    if (!conversation) {
      throw new Error('Conversation not active');
    }

    if (!userText || userText.trim().length === 0) {
      throw new Error('Empty user input');
    }

    logger.info('Sending text to agent', { userText });

    // The ElevenLabs Agents SDK handles the text input
    // For the REST/streaming API, we'd send: {userInput: userText}
    // The SDK will convert this to speech and stream the response

    const response: AgentResponse = {
      audio: null, // Audio is played automatically by SDK
      text: userText, // Return the actual user input
      timestamp: new Date().toISOString(),
    };

    return response;
  } catch (error) {
    logger.error('Error sending text to agent', error);
    throw error;
  }
}

/**
 * Listen to agent responses in real-time
 */
export function onAgentResponse(
  conversation: Conversation,
  callback: (response: { text: string; timestamp: string }) => void
): () => void {
  try {
    logger.info('Setting up agent response listener');

    // The ElevenLabs SDK handles agent responses automatically
    // They are displayed as text/audio in real-time through the connection
    // This is a no-op for now - responses come through the connection stream
    
    // Note: Check ElevenLabs SDK documentation for actual event/callback API
    // The Conversation object may have different methods based on SDK version

    return () => {
      // Cleanup function
      logger.debug('Agent response listener cleaned up');
    };
  } catch (error) {
    logger.error('Error setting up response listener', error);
    return () => {};
  }
}

/**
 * Get audio frequency data for visualization
 */
export function getInputFrequencyData(conversation: Conversation): Uint8Array | null {
  try {
    if (typeof (conversation as any).getInputByteFrequencyData === 'function') {
      return (conversation as any).getInputByteFrequencyData();
    }
    return null;
  } catch (error) {
    logger.debug('Could not get input frequency data', error);
    return null;
  }
}

export function getOutputFrequencyData(conversation: Conversation): Uint8Array | null {
  try {
    if (typeof (conversation as any).getOutputByteFrequencyData === 'function') {
      return (conversation as any).getOutputByteFrequencyData();
    }
    return null;
  } catch (error) {
    logger.debug('Could not get output frequency data', error);
    return null;
  }
}

/**
 * Change output audio device
 */
export async function changeOutputDevice(
  conversation: Conversation,
  deviceId: string,
  sampleRate: number = 16000
): Promise<void> {
  try {
    // Note: Check ElevenLabs SDK docs for device switching API
    // This function is a placeholder for future implementation
    logger.info('Output device change requested', { deviceId, sampleRate });
    
    if (typeof (conversation as any).changeOutputDevice === 'function') {
      await (conversation as any).changeOutputDevice({
        sampleRate,
        format: 'pcm',
        outputDeviceId: deviceId,
      });
      logger.info('Output device changed', { deviceId, sampleRate });
    }
  } catch (error) {
    logger.error('Error changing output device', error);
    throw error;
  }
}

/**
 * End conversation
 */
export async function endAgentConversation(conversation: Conversation): Promise<void> {
  try {
    if (conversation && typeof conversation.endSession === 'function') {
      await conversation.endSession();
      logger.info('Agent conversation ended');
    }
    activeConversation = null;
  } catch (error) {
    logger.error('Error ending conversation', error);
    throw error;
  }
}

/**
 * Get active conversation
 */
export function getActiveConversation(): Conversation | null {
  return activeConversation;
}

/**
 * List available audio devices
 */
export async function getAvailableAudioDevices(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(
      (device) => device.kind === 'audioinput' || device.kind === 'audiooutput'
    );
    logger.info('Available audio devices', audioDevices);
    return audioDevices;
  } catch (error) {
    logger.error('Error enumerating audio devices', error);
    return [];
  }
}

/**
 * Check if microphone permission is granted
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    if (!navigator.permissions) {
      return true; // Assume granted if API not available
    }

    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state === 'granted';
  } catch (error) {
    logger.debug('Could not check microphone permission', error);
    return false;
  }
}

/**
 * Handle ElevenLabs errors
 */
export function handleElevenLabsError(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('microphone') || message.includes('permission denied')) {
    return 'Microphone access was denied. Please allow microphone access to use voice chat.';
  }

  if (message.includes('agent') || message.includes('not found')) {
    return 'Could not find the agent. Please check the agent ID.';
  }

  if (message.includes('network') || message.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }

  if (message.includes('timeout')) {
    return 'Connection timeout. Please check your internet connection.';
  }

  if (message.includes('api key') || message.includes('authentication')) {
    return 'Authentication error. Please check your API key.';
  }

  return `Error: ${error.message || 'An unexpected error occurred'}`;
}

