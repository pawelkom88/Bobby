import { convertFloat32ToInt16, downsample } from './audioUtils';
import { fetchDeepgramToken } from '@/lib/api/deepgram';
import { logger } from '@/lib/logger';

export const getAuthToken = async (firebaseIdToken: string) => {
  try {
    if (!firebaseIdToken) {
      logger.error('getAuthToken: Firebase ID token is missing or empty');
      return null;
    }

    logger.log(
      'getAuthToken: Sending request with token:',
      firebaseIdToken.substring(0, 20) + '...'
    );
    const result = await fetchDeepgramToken(firebaseIdToken);
    logger.log('getAuthToken: Success, got token');
    return result.access_token;
  } catch (error) {
    logger.error('Error fetching auth token:', error);
    return null;
  }
};

export const sendMicToSocket =
  (socket: WebSocket) => (event: AudioProcessingEvent) => {
    logger.log(
      'deepgramUtils: sendMicToSocket called, socket readyState:',
      socket.readyState
    );
    if (socket.readyState === WebSocket.OPEN) {
      logger.log('deepgramUtils: Socket open, processing audio data');
      const inputData = event.inputBuffer.getChannelData(0);
      const downsampledData = downsample(inputData, 48000, 16000);
      const audioDataToSend = convertFloat32ToInt16(downsampledData);
      logger.log(
        'deepgramUtils: Sending audio data, length:',
        audioDataToSend.length
      );
      socket.send(audioDataToSend);
    } else {
      logger.warn(
        'deepgramUtils: Socket not open, skipping audio send, readyState:',
        socket.readyState
      );
    }
  };

export const sendSocketMessage = (socket: WebSocket, message: any) => {
  logger.log(
    `deepgramUtils: sendSocketMessage called, socket readyState: ${socket.readyState}, message type: ${message?.type || message}`
  );
  if (socket.readyState === WebSocket.OPEN) {
    logger.log('deepgramUtils: Sending message:', JSON.stringify(message));
    socket.send(JSON.stringify(message));
  } else {
    logger.warn(
      'deepgramUtils: Socket not open, skipping message send, readyState:',
      socket.readyState
    );
  }
};

export const sendKeepAliveMessage = (socket: WebSocket) => () => {
  logger.log(
    'deepgramUtils: sendKeepAliveMessage called, socket readyState:',
    socket.readyState
  );
  if (socket.readyState === WebSocket.OPEN) {
    logger.log('deepgramUtils: Sending KeepAlive');
    sendSocketMessage(socket, { type: 'KeepAlive' });
  } else {
    logger.warn(
      'deepgramUtils: Socket not open, skipping keepalive, readyState:',
      socket.readyState
    );
  }
};

// Configuration interfaces
export interface DeepgramAgentConfig {
  type: 'Settings';
  audio: {
    input: {
      encoding: string;
      sample_rate: number;
    };
    output: {
      encoding: string;
      sample_rate: number;
      container?: string;
    };
  };
  agent: {
    language: string;
    context?: {
      messages: Array<{
        type: string;
        role: 'user' | 'assistant';
        content: string;
      }>;
    };
    listen: {
      provider: {
        type: string;
        model: string;
      };
    };
    think: {
      provider: {
        type: string;
        model: string;
        temperature?: number;
      };
      prompt: string;
      context_length?: {
        max?: number;
      };
    };
    speak: {
      provider: {
        type: string;
        model_id: string;
        voice_id: string;
        voice?: {
          mode: string;
          id: string;
        };
        speed?: number;
      };
    };
    greeting?: string;
  };
}
