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
    if (socket && socket.readyState === WebSocket.OPEN) return;

    setSocketState(0); // Connecting

    try {
      const token = await getAuthToken();
      if (!token) {
        console.error("Failed to get auth token");
        setSocketState(2); // Error
        return;
      }

      const ws = new WebSocket("wss://agent.deepgram.com/v1/agent/converse", [
        "bearer",
        token,
      ]);

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        console.log("Deepgram WebSocket connected");
        setSocketState(1); // Connected
        
        // Start keep-alive
        keepAliveInterval.current = setInterval(sendKeepAliveMessage(ws), 5000);
      };

      ws.onerror = (error) => {
        console.error("Deepgram WebSocket error:", error);
        setSocketState(2); // Error
      };

      ws.onclose = () => {
        console.log("Deepgram WebSocket closed");
        setSocketState(3); // Closed
        if (keepAliveInterval.current) {
          clearInterval(keepAliveInterval.current);
          keepAliveInterval.current = null;
        }
        setSocket(null);
      };

      setSocket(ws);
    } catch (error) {
      console.error("Error connecting to Deepgram:", error);
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

