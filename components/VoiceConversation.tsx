'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSettings } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { CONFIG } from '@/lib/config';
import LoadingSpinner from './LoadingSpinner';
import CartoonButton from './CartoonButton';
import { useSound } from './SoundProvider';
import { startConnectingSound, playEndConversationSound } from '@/lib/uiSound';
import type { AgeTier, Service, ConversationMessage } from '@/types';
import Image from 'next/image';
import VoiceAnimations from './VoiceAnimations';
import TimerDisplay from './TimerDisplay';

// Deepgram & Audio imports
import { useDeepgram } from '@/context/DeepgramContextProvider';
import { useMicrophone } from '@/context/MicrophoneContextProvider';
import { sendMicToSocket, sendSocketMessage, DeepgramAgentConfig } from '@/utils/deepgramUtils';
import { createAudioBuffer, playAudioBuffer } from '@/utils/audioUtils';
import { generateSystemPrompt } from '@/lib/prompts';

interface VoiceConversationProps {
  ageTier?: AgeTier;
  situation?: Service;
  onComplete?: (conversation: ConversationMessage[]) => void;
  onBack?: () => void;
  autoStart?: boolean;
}

/**
 * Voice conversation component with Deepgram Voice Agent API
 */
export default function VoiceConversation({
  ageTier = 1,
  situation = 'fire',
  onComplete,
  onBack,
  autoStart = false,
}: VoiceConversationProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // State Machine
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Thinking
  const [isSpeaking, setIsSpeaking] = useState(false); // Agent Speaking
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(CONFIG.SESSION_MAX_DURATION_SECONDS);

  // Deepgram & Microphone Hooks
  const { socket, socketState, connectToDeepgram, disconnectFromDeepgram } = useDeepgram();
  const { setupMicrophone, startMicrophone, microphone, microphoneState, microphoneError, processor } = useMicrophone();

  // Refs
  const stopConnectingSoundRef = useRef<(() => void) | null>(null);
  const hasAutoStartedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const scheduledAudioSources = useRef<AudioBufferSourceNode[]>([]);

  const settings = getSettings();
  const { soundEnabled } = useSound();

  // Derived visual state
  const visualState: 'listening' | 'processing' | 'speaking' | 'error' | 'idle' =
    error || microphoneError ? 'error' :
      isProcessing ? 'processing' :
        isSpeaking ? 'speaking' :
          isListening ? 'listening' :
            'idle';

  // Initialize playback AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // Deepgram standard output
        latencyHint: 'interactive',
      });
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Setup Microphone on mount
  useEffect(() => {
    setupMicrophone();
    return () => {
        // Cleanup audio sources
        scheduledAudioSources.current.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check permissions based on microphone state
  useEffect(() => {
      if (microphoneState === null) {
          // Setting up or failed
      } else if (microphoneState === 0) {
          // Setting up
      } 
      // If failed, microphoneState might remain null or we can add error state to context
      if (microphoneError) {
        setPermissionError(microphoneError);
      }
  }, [microphoneState, microphoneError]);


  // Auto-start conversation
  useEffect(() => {
    if (autoStart && microphoneState === 1 && !sessionActive && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const timer = setTimeout(() => {
        startConversation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, microphoneState, sessionActive]);

  // Update remaining time
  useEffect(() => {
    if (!sessionActive) return;
    
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          endConversation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive]);

  // Handle Deepgram Messages (Audio & Events)
  useEffect(() => {
    if (!socket) return;

    const onMessage = async (event: MessageEvent) => {
      console.log('VoiceConversation: onMessage received, data type:', typeof event.data, 'length:', event.data.length);
      if (event.data instanceof ArrayBuffer) {
        console.log('VoiceConversation: Received audio data, processing...');
        // Audio Data
        if (audioContextRef.current) {
          const buffer = createAudioBuffer(audioContextRef.current, event.data);
          if (buffer) {
            const source = playAudioBuffer(audioContextRef.current, buffer, startTimeRef);
            scheduledAudioSources.current.push(source);
            source.onended = () => {
                const index = scheduledAudioSources.current.indexOf(source);
                if (index > -1) scheduledAudioSources.current.splice(index, 1);
                
                // Only set not speaking if queue is empty (approximate)
                // Better to rely on AgentAudioDone or explicit events if available
            };
            setIsSpeaking(true);
            setIsProcessing(false);
            setIsListening(false);
          }
        }
      } else {
        console.log('VoiceConversation: Received JSON message, parsing...');
        // JSON Message
        try {
          const msg = JSON.parse(event.data);
          console.log('VoiceConversation: Parsed message:', msg);

          logger.debug('Deepgram Message:', msg);

          switch (msg.type) {
            case 'UserStartedSpeaking':
              setIsListening(false);
              setIsProcessing(true); // User speaking, agent thinking/listening
              setIsSpeaking(false);
              
              // Clear queued audio if user interrupts
              scheduledAudioSources.current.forEach(source => {
                  try { source.stop(); } catch(e) {}
              });
              scheduledAudioSources.current = [];
              if (audioContextRef.current) {
                  startTimeRef.current = audioContextRef.current.currentTime;
              }
              break;

            case 'AgentStartedSpeaking':
              setIsSpeaking(true);
              setIsProcessing(false);
              setIsListening(false);
              break;

            case 'AgentAudioDone':
               // Agent finished sending audio. 
               // Playback might continue for a bit.
               // We can set state to listening after a short delay or rely on silence?
               // Deepgram usually handles state well.
               setIsSpeaking(false);
               setIsListening(true);
               break;

            case 'ConversationText':
              // Add to conversation history
              const newMsg: ConversationMessage = {
                type: msg.role === 'user' ? 'user' : 'agent',
                text: msg.content,
                timestamp: new Date().toISOString(),
              };
              setConversation(prev => [...prev, newMsg]);
              break;
            
            case 'EndOfThought':
               // Agent finished thinking
               break;

            default:
              break;
          }
        } catch (e) {
          console.error("Error parsing Deepgram message", e);
        }
      }
    };

    socket.addEventListener('message', onMessage);
    return () => socket.removeEventListener('message', onMessage);
  }, [socket]);

  // Send Mic Data to Socket
  useEffect(() => {
    if (microphone && socket && socketState === 1 && processor) {
      processor.onaudioprocess = sendMicToSocket(socket);
    }
    return () => {
        if (processor) processor.onaudioprocess = null;
    };
  }, [microphone, socket, socketState, processor]);

  const startConversation = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Start connecting sound
      stopConnectingSoundRef.current = startConnectingSound(soundEnabled);

      // Connect to Deepgram
      await connectToDeepgram();

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Error starting conversation', { message });
      setError('Failed to connect to Bobby. Please try again.');
      setIsConnecting(false);
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }
    }
  };

  // When socket opens, send configuration
  useEffect(() => {
    console.log('VoiceConversation: socketState changed to', socketState, 'isConnecting:', isConnecting);
      if (socketState === 1 && isConnecting) {
          console.log('VoiceConversation: Socket connected, sending configuration');
          // Connected
          setIsConnecting(false);
          setSessionActive(true);
          if (stopConnectingSoundRef.current) {
            stopConnectingSoundRef.current();
            stopConnectingSoundRef.current = null;
          }

          // Send Configuration
          console.log('VoiceConversation: Generating system prompt...');
          const instructions = generateSystemPrompt(ageTier, situation);
          console.log('VoiceConversation: System prompt generated, length:', instructions.length);
          
          const config: DeepgramAgentConfig = {
              type: "Settings",
              audio: {
                  input: {
                      encoding: "linear16",
                      sample_rate: 16000,
                  },
                  output: {
                      encoding: "linear16",
                      sample_rate: 24000,
                      container: "none",
                  }
              },
              agent: {
                  language: "en",
                  listen: {
                      provider: {
                          type: "deepgram",
                          model: "nova-3",
                      }
                  },
                  think: {
                      provider: {
                          type: "open_ai",
                          model: "gpt-4o-mini",
                      },
                      prompt: instructions,
                  },
                  speak: {
                      provider: {
                          type: "deepgram",
                          model: "aura-2-draco-en"
                      }
                  }
              }
          };

          console.log('VoiceConversation: Config created:', JSON.stringify(config, null, 2));

          if (socket) {
            console.log('VoiceConversation: Sending Settings message to socket');
            sendSocketMessage(socket, config);
            
            console.log('VoiceConversation: Starting microphone');
            startMicrophone();
            setIsListening(true);
          } else {
            console.error('VoiceConversation: Socket is null when trying to send config');
          }
      } else if (socketState === 2) {
          console.log('VoiceConversation: Socket error state detected');
          // Error
          if (isConnecting) {
            setIsConnecting(false);
            setError("Connection to voice server failed.");
            if (stopConnectingSoundRef.current) {
                stopConnectingSoundRef.current();
                stopConnectingSoundRef.current = null;
            }
          }
      }
  }, [socketState, isConnecting, socket, ageTier, situation, startMicrophone]);

  const endConversation = async () => {
    try {
      disconnectFromDeepgram();
      
      // Stop audio
      scheduledAudioSources.current.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      scheduledAudioSources.current = [];

      setIsSpeaking(false);
      setIsListening(false);
      setConversationEnded(true);

      // Play end sound
      playEndConversationSound(soundEnabled);

      // Complete
      if (onComplete) {
        onComplete(conversation);
      }
    } catch (err) {
      logger.error('Error ending conversation', err);
    }
  };

  if (error && !sessionActive) {
    return (
      <div className="voice-conversation" role="alert">
        <div className="connection-error">
          <div className="error-header">
            <h3>Connection Error</h3>
            <p>We couldn't connect to Bobby. Please try again.</p>
          </div>
          <p className="error-details">{error}</p>
          <div className="error-action-buttons">
            {onBack && (
              <CartoonButton onClick={onBack} ariaLabel="Go back to previous step">
                ← Go Back
              </CartoonButton>
            )}
            <CartoonButton
              onClick={() => (window.location.href = '/')}
              ariaLabel="Return to home"
            >
              Home
            </CartoonButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-conversation" role="region" aria-label="Voice conversation">
      <div className="conversation-header">
        {onBack && !sessionActive && (
          <button
            type="button"
            className="back-button"
            onClick={onBack}
            aria-label="Go back to dial pad"
          >
            ← Back
          </button>
        )}
        {sessionActive && (
          <TimerDisplay remainingSeconds={remainingTime} />
        )}
      </div>

      {!sessionActive && !conversationEnded ? (
        <>
          <h1 className="conversation-subtitle">Just a moment ...</h1>
          <p className="conversation-subtitle-text">Bobby is getting ready to chat!</p>
          <br />
          <Image src="/bobby-connecting.png" alt="Bobby is getting ready to chat" width={200} height={250} />
          <br />
          
          <div className="conversation-start-section">
            {isConnecting && <LoadingSpinner />}
          </div>
        </>
      ) : conversationEnded ? (
        <div className="conversation-ending" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Processing your conversation...</h2>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Visual Feedback */}
          <div className="conversation-visuals" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <h2 className="kavoon" style={{ fontSize: '2rem', color: '#333' }}>
              {visualState === 'speaking' && "Bobby is speaking..."}
              {visualState === 'listening' && "Your turn to speak!"}
              {visualState === 'processing' && "Bobby is thinking..."}
              {visualState === 'error' && "Something went wrong"}
            </h2>

            <VoiceAnimations state={visualState} />
          </div>

          {/* Subtitles (Agent only) */}
          {(settings.subtitles) && conversation.length > 0 && (
            <div className="subtitles" role="region" aria-label="Subtitles" style={{
              marginTop: 'auto',
              marginBottom: '2rem',
              padding: '1.25rem',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '1rem',
              maxWidth: '85%',
            }}>
              {conversation
                .filter((msg) => msg.type === 'agent')
                .slice(-1)
                .map((msg, index) => (
                  <p key={index} className="subtitle-text" style={{ 
                    fontSize: '1.2rem', 
                    textAlign: 'center',
                    lineHeight: '1.5',
                    margin: 0,
                    color: '#333'
                  }}>
                    {msg.text}
                  </p>
                ))}
            </div>
          )}

          {/* Controls */}
          <div className="conversation-controls" style={{ marginTop: 'auto' }}>
            <CartoonButton
              onClick={() => void endConversation()}
              ariaLabel="End conversation"
              className="cartoon-btn-danger"
            >
              End Call
            </CartoonButton>
          </div>
        </>
      )}

      {error && sessionActive && (
        <div className="conversation-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
