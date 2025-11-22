import { convertFloat32ToInt16, downsample } from "./audioUtils";

export const getAuthToken = async () => {
  try {
    const response = await fetch("/api/authenticate");
    const result = await response.json();
    return result.access_token;
  } catch (error) {
    console.error("Error fetching auth token:", error);
    return null;
  }
};

export const sendMicToSocket = (socket: WebSocket) => (event: AudioProcessingEvent) => {
  if (socket.readyState === WebSocket.OPEN) {
    const inputData = event.inputBuffer.getChannelData(0);
    const downsampledData = downsample(inputData, 48000, 16000);
    const audioDataToSend = convertFloat32ToInt16(downsampledData);
    socket.send(audioDataToSend);
  }
};

export const sendSocketMessage = (socket: WebSocket, message: any) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
};

export const sendKeepAliveMessage = (socket: WebSocket) => () => {
  sendSocketMessage(socket, { type: "KeepAlive" });
};

// Configuration interfaces
export interface DeepgramAgentConfig {
  type: "Settings";
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
    listen: {
      model: string;
    };
    think: {
      provider: {
        type: string;
      };
      model: string;
      instructions: string;
    };
    speak: {
      model: string;
    };
  };
}

