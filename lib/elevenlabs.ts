/**
 * ElevenLabs SDK integration for voice agent conversations
 * 
 * SECURITY NOTE: API key is exposed client-side using NEXT_PUBLIC_ prefix.
 * This is intentional for direct client-side integration, but be aware:
 * - API key will be visible in browser dev tools
 * - Consider implementing rate limiting on ElevenLabs account
 * - Monitor API usage for abuse
 * - Future migration to API route proxy recommended for production
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import type { AgentConnection, AgentResponse } from '@/types';

let client: ElevenLabsClient | null = null;

/**
 * Initialize ElevenLabs client
 */
export function initializeElevenLabsClient(): ElevenLabsClient | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.warn('ElevenLabs API key not found. Set NEXT_PUBLIC_ELEVENLABS_API_KEY in .env.local');
    return null;
  }
  
  // Validate API key format (basic check)
  if (typeof apiKey !== 'string' || apiKey.length < 10) {
    console.error('Invalid ElevenLabs API key format');
    return null;
  }
  
  try {
    client = new ElevenLabsClient({
      apiKey: apiKey,
    });
    return client;
  } catch (error) {
    console.error('Error initializing ElevenLabs client:', error);
    return null;
  }
}

/**
 * Get ElevenLabs client instance (initializes if needed)
 */
export function getElevenLabsClient(): ElevenLabsClient | null {
  if (!client) {
    return initializeElevenLabsClient();
  }
  return client;
}

/**
 * Check if ElevenLabs is properly configured
 */
export function isElevenLabsConfigured(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  return !!apiKey && typeof apiKey === 'string' && apiKey.length >= 10;
}

/**
 * Connect to ElevenLabs agent
 */
export async function connectToAgent(agentId: string | null = null): Promise<AgentConnection> {
  const client = getElevenLabsClient();
  
  if (!client) {
    throw new Error('ElevenLabs client not initialized. Check API key.');
  }
  
  const agentIdToUse = agentId || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  
  if (!agentIdToUse) {
    throw new Error('Agent ID not provided. Set NEXT_PUBLIC_ELEVENLABS_AGENT_ID or pass agentId parameter.');
  }
  
  try {
    // Note: Actual implementation depends on ElevenLabs SDK API
    // This is a placeholder structure - adjust based on actual SDK methods
    return {
      agentId: agentIdToUse,
      client,
      connected: true,
    };
  } catch (error) {
    console.error('Error connecting to agent:', error);
    throw error;
  }
}

/**
 * Send message to agent and get audio response
 */
export async function sendMessageToAgent(
  agentConnection: AgentConnection,
  message: string
): Promise<AgentResponse> {
  if (!agentConnection || !agentConnection.connected) {
    throw new Error('Agent not connected');
  }
  
  try {
    // Note: Actual implementation depends on ElevenLabs SDK API
    // This is a placeholder - adjust based on actual SDK methods for agent conversations
    // The SDK may have methods like agent.conversate() or similar
    
    // For now, return a placeholder structure
    // You'll need to implement based on actual ElevenLabs agent SDK methods
    return {
      audio: null,
      text: '',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error sending message to agent:', error);
    throw error;
  }
}

/**
 * Handle audio stream playback
 */
export async function playAudioResponse(audioData: Blob | string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio();
      
      if (audioData instanceof Blob) {
        audio.src = URL.createObjectURL(audioData);
      } else if (typeof audioData === 'string') {
        audio.src = audioData;
      } else {
        reject(new Error('Invalid audio data format'));
        return;
      }
      
      audio.onloadeddata = () => {
        audio.play().then(() => {
          resolve(audio);
        }).catch(reject);
      };
      
      audio.onerror = reject;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Handle errors from ElevenLabs API
 */
export function handleElevenLabsError(error: Error): string {
  if (error.message.includes('API key')) {
    return 'API key error. Please check your configuration.';
  }
  
  if (error.message.includes('Agent')) {
    return 'Could not connect to agent. Please try again.';
  }
  
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  
  return 'An error occurred. Please try again.';
}

