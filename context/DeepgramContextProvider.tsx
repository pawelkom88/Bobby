'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { getAuthToken, sendKeepAliveMessage } from '@/utils/deepgramUtils';
import {logger} from "@/lib/logger";
import { useAuth } from '@/context/AuthContext';

interface DeepgramContextType {
  socket: WebSocket | null;
  socketState: number; // 0=connecting, 1=connected, 2=error, 3=closed
  connectToDeepgram: () => Promise<void>;
  disconnectFromDeepgram: () => void;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(
  undefined
);

export const DeepgramContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketState, setSocketState] = useState<number>(3); // Start closed
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null);

  const connectToDeepgram = async () => {
    logger.log('DeepgramContext: connectToDeepgram called');
    if (socket && socket.readyState === WebSocket.OPEN) {
      logger.log('DeepgramContext: Socket already open, returning');
      return;
    }

    setSocketState(0); // Connecting
    logger.log('DeepgramContext: Setting socket state to connecting (0)');

    try {
      if (!user) {
        logger.error('DeepgramContext: User not authenticated');
        setSocketState(2); // Error
        return;
      }

      logger.log('DeepgramContext: Getting Firebase ID token...');
      const idToken = await user.getIdToken(true);
      logger.log('DeepgramContext: ID token obtained:', idToken ? `${idToken.substring(0, 20)}...` : 'NULL');
      
      if (!idToken) {
        logger.error('DeepgramContext: Failed to get Firebase ID token');
        setSocketState(2); // Error
        return;
      }

      logger.log('DeepgramContext: Fetching Deepgram auth token...');
      const token = await getAuthToken(idToken);
      logger.log(
        'DeepgramContext: Auth token received:',
        token ? 'SUCCESS' : 'FAILED'
      );
      if (!token) {
        logger.error('DeepgramContext: Failed to get auth token');
        setSocketState(2); // Error
        return;
      }

      logger.log('DeepgramContext: Creating WebSocket connection...');
      const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', [
        'bearer',
        token,
      ]);
      logger.log(
        'DeepgramContext: WebSocket created, setting up event listeners'
      );

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        logger.log(
          'DeepgramContext: WebSocket onopen triggered - connected successfully'
        );
        setSocketState(1); // Connected

        // Start keep-alive
        logger.log('DeepgramContext: Starting keep-alive interval (5000ms)');
        keepAliveInterval.current = setInterval(sendKeepAliveMessage(ws), 5000);
      };

      ws.onerror = error => {
        logger.error('DeepgramContext: WebSocket onerror:', error);
        setSocketState(2); // Error
      };

      ws.onclose = () => {
        logger.log('DeepgramContext: WebSocket onclose triggered');
        setSocketState(3); // Closed
        if (keepAliveInterval.current) {
          logger.log('DeepgramContext: Clearing keep-alive interval');
          clearInterval(keepAliveInterval.current);
          keepAliveInterval.current = null;
        }
        setSocket(null);
      };

      ws.onmessage = event => {
        logger.log('DeepgramContext: Received message:', event.data);
        try {
          if (typeof event.data === 'string') {
            const parsed = JSON.parse(event.data);
            logger.log('DeepgramContext: Parsed message:', parsed);
          } else {
            logger.log('DeepgramContext: Binary message received');
          }
        } catch (e) {
          logger.error('DeepgramContext: Failed to parse message:', e);
        }
      };

      logger.log('DeepgramContext: Setting socket state');
      setSocket(ws);
    } catch (error) {
      logger.error('DeepgramContext: Error in connectToDeepgram:', error);
      setSocketState(2); // Error
    }
  };

  const disconnectFromDeepgram = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setSocketState(3);
    }
    if (keepAliveInterval.current) {
      clearInterval(keepAliveInterval.current);
      keepAliveInterval.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromDeepgram();
    };
  }, []);

  return (
    <DeepgramContext.Provider
      value={{
        socket,
        socketState,
        connectToDeepgram,
        disconnectFromDeepgram,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

export function useDeepgram() {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      'useDeepgram must be used within a DeepgramContextProvider'
    );
  }
  return context;
}
