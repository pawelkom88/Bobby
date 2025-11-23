'use client';

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { getAuthToken, sendKeepAliveMessage } from "@/utils/deepgramUtils";

interface DeepgramContextType {
  socket: WebSocket | null;
  socketState: number; // 0=connecting, 1=connected, 2=error, 3=closed
  connectToDeepgram: () => Promise<void>;
  disconnectFromDeepgram: () => void;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

export const DeepgramContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketState, setSocketState] = useState<number>(3); // Start closed
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null);

  const connectToDeepgram = async () => {
    console.log('DeepgramContext: connectToDeepgram called');
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('DeepgramContext: Socket already open, returning');
      return;
    }

    setSocketState(0); // Connecting
    console.log('DeepgramContext: Setting socket state to connecting (0)');

    try {
      console.log('DeepgramContext: Fetching auth token...');
      const token = await getAuthToken();
      console.log('DeepgramContext: Auth token received:', token ? 'SUCCESS' : 'FAILED');
      if (!token) {
        console.error("DeepgramContext: Failed to get auth token");
        setSocketState(2); // Error
        return;
      }

      console.log('DeepgramContext: Creating WebSocket connection...');
      const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", [
        "bearer",
        token,
      ]);
      console.log('DeepgramContext: WebSocket created, setting up event listeners');

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        console.log("DeepgramContext: WebSocket onopen triggered - connected successfully");
        setSocketState(1); // Connected
        
        // Start keep-alive
        console.log('DeepgramContext: Starting keep-alive interval (5000ms)');
        keepAliveInterval.current = setInterval(sendKeepAliveMessage(ws), 5000);
      };

      ws.onerror = (error) => {
        console.error("DeepgramContext: WebSocket onerror:", error);
        setSocketState(2); // Error
      };

      ws.onclose = () => {
        console.log("DeepgramContext: WebSocket onclose triggered");
        setSocketState(3); // Closed
        if (keepAliveInterval.current) {
          console.log('DeepgramContext: Clearing keep-alive interval');
          clearInterval(keepAliveInterval.current);
          keepAliveInterval.current = null;
        }
        setSocket(null);
      };

      ws.onmessage = (event) => {
        console.log('DeepgramContext: Received message:', event.data);
        try {
          if (typeof event.data === 'string') {
            const parsed = JSON.parse(event.data);
            console.log('DeepgramContext: Parsed message:', parsed);
          } else {
            console.log('DeepgramContext: Binary message received');
          }
        } catch (e) {
          console.error('DeepgramContext: Failed to parse message:', e);
        }
      };

      console.log('DeepgramContext: Setting socket state');
      setSocket(ws);
    } catch (error) {
      console.error("DeepgramContext: Error in connectToDeepgram:", error);
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
    throw new Error("useDeepgram must be used within a DeepgramContextProvider");
  }
  return context;
}

