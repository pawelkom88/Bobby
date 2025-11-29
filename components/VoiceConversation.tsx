'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserData } from '@/context/UserDataContext';
import { logger } from '@/lib/logger';
import { CONFIG } from '@/lib/config';
import LoadingSpinner from './LoadingSpinner';
import CartoonButton from './CartoonButton';
import { useSound } from './SoundProvider';
import { startConnectingSound, playEndConversationSound } from '@/lib/uiSound';
import type { AgeTier, Service, ConversationMessage } from '@/types';
import Image from 'next/image';
import VoiceAnimations from './VoiceAnimations';
import CartoonTimer from './CartoonTimer';
import { useDeepgram } from '@/context/DeepgramContextProvider';
import { useMicrophone } from '@/context/MicrophoneContextProvider';
import {
  sendMicToSocket,
  sendSocketMessage,
  DeepgramAgentConfig,
} from '@/utils/deepgramUtils';
import { createAudioBuffer, playAudioBuffer } from '@/utils/audioUtils';
import {
  getAmbulancePrompt,
  getFirePrompt,
  getPolicePrompt,
} from '@/lib/prompts';

interface ActiveConversationViewProps {
  visualState: 'listening' | 'processing' | 'speaking' | 'error' | 'idle';
  settings: { subtitles: boolean };
  conversation: ConversationMessage[];
  sessionActive: boolean;
  remainingTime: number;
  endConversation: () => void;
}

// Component: ActiveConversationView
function ActiveConversationView({
  visualState,
  settings,
  conversation,
  sessionActive,
  remainingTime,
  endConversation,
}: ActiveConversationViewProps) {
  return (
    <>
      {/* Visual Feedback */}
      <div
        className="conversation-visuals"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        <h2 style={{ fontSize: '2rem', color: '#333' }}>
          {visualState === 'speaking' && 'Bobby is speaking...'}
          {visualState === 'listening' && 'Your turn to speak!'}
          {visualState === 'processing' && 'Bobby is thinking...'}
          {visualState === 'error' && 'Something went wrong'}
        </h2>

        <VoiceAnimations state={visualState} />
      </div>

      {/* Subtitles (Agent only) */}
      {settings.subtitles && conversation.length > 0 && (
        <div
          className="subtitles"
          role="region"
          aria-label="Subtitles"
          style={{
            marginTop: 'auto',
            marginBottom: '2rem',
            padding: '1.25rem',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '1rem',
            maxWidth: '85%',
          }}
        >
          {conversation
            .filter(msg => msg.type === 'agent')
            .slice(-1)
            .map((msg, index) => (
              <p
                key={index}
                className="subtitle-text"
                style={{
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  lineHeight: '1.5',
                  margin: 0,
                  color: '#333',
                }}
              >
                {msg.text}
              </p>
            ))}
        </div>
      )}

      {/* Timer and Controls */}
      <div className="conversation-controls" style={{ marginTop: 'auto' }}>
        {sessionActive && <CartoonTimer remainingSeconds={remainingTime} />}
        <CartoonButton
          onClick={() => void endConversation()}
          ariaLabel="End conversation"
          className="cartoon-btn-danger"
        >
          End Call
        </CartoonButton>
      </div>
    </>
  );
}

interface VoiceConversationProps {
  ageTier?: AgeTier;
  situation?: Service;
  onComplete?: (conversation: ConversationMessage[]) => void;
  onBack?: () => void;
  autoStart?: boolean;
  disableConnection?: boolean;
}

export default function VoiceConversation({
  ageTier = 1,
  situation = 'fire',
  onComplete,
  onBack,
  autoStart = false,
  disableConnection = false,
}: VoiceConversationProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Thinking
  const [isSpeaking, setIsSpeaking] = useState(false); // Agent Speaking

  const [conversation, setConversation] = useState<ConversationMessage[]>(
    () => {
      // Clear old debug data on component mount
      if (typeof window !== 'undefined') {
        try {
          const timestamp = localStorage.getItem(
            'debug_conversation_timestamp'
          );
          if (timestamp) {
            const age = Date.now() - parseInt(timestamp);
            if (age > 60000) {
              // 1 minute
              localStorage.removeItem('debug_conversation');
              localStorage.removeItem('debug_conversation_timestamp');
              logger.log('🔍 Cleared old debug conversation data (>1 min old)');
            }
          }
          // Always clear on new conversation start
          localStorage.removeItem('debug_conversation');
          localStorage.removeItem('debug_conversation_timestamp');
          logger.log('🔍 Starting fresh conversation - cleared debug data');
        } catch (e) {
          logger.error('Failed to clear debug conversation data:', e);
        }
      }
      return [];
    }
  );
  const [sessionActive, setSessionActive] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remainingTime, setRemainingTime] = useState(
    CONFIG.MAX_CONVERSATION_TIME_MINUTES * 60
  );

  // Deepgram & Microphone Hooks
  const { socket, socketState, connectToDeepgram, disconnectFromDeepgram } =
    useDeepgram();
  const {
    setupMicrophone,
    startMicrophone,
    microphone,
    microphoneState,
    microphoneError,
    processor,
  } = useMicrophone();

  // Refs
  const stopConnectingSoundRef = useRef<(() => void) | null>(null);
  const hasAutoStartedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const scheduledAudioSources = useRef<AudioBufferSourceNode[]>([]);

  const { getSettings } = useUserData();
  const settings = getSettings();
  const { soundEnabled } = useSound();

  // Derived visual state
  const visualState:
    | 'listening'
    | 'processing'
    | 'speaking'
    | 'error'
    | 'idle' =
    error || microphoneError
      ? 'error'
      : isProcessing
        ? 'processing'
        : isSpeaking
          ? 'speaking'
          : isListening
            ? 'listening'
            : 'idle';

  // Silence detection
  const silenceThreshold = useRef(0.05); // Audio level threshold for silence (reduce false positives)
  const silenceDuration = useRef(8000); // 8 seconds
  const lastAudioTime = useRef(Date.now());
  const silenceCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Monitor audio levels
  const checkAudioLevels = useCallback(
    (audioData: Float32Array) => {
      const maxLevel = Math.max(...audioData.map(Math.abs));
      if (maxLevel > silenceThreshold.current) {
        // Only reset timer if agent is not speaking (i.e., this is user speech)
        if (!isSpeaking) {
          lastAudioTime.current = Date.now();
          logger.log(
            'VoiceConversation: User audio detected, resetting silence timer'
          );

          // Clear any pending silence timeout
          if (silenceTimeout.current) {
            clearTimeout(silenceTimeout.current);
            silenceTimeout.current = null;
          }
        } else {
          logger.log(
            'VoiceConversation: Agent audio detected, not resetting silence timer'
          );
        }
      }
    },
    [isSpeaking]
  );

  // Start silence monitoring
  const startSilenceMonitoring = useCallback(() => {
    logger.log('VoiceConversation: Starting silence monitoring');
    // Reset the silence timer whenever we (re)start monitoring so the child gets a full window to respond
    lastAudioTime.current = Date.now();
    silenceCheckInterval.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastAudio = now - lastAudioTime.current;

      if (
        timeSinceLastAudio >= silenceDuration.current &&
        !silenceTimeout.current
      ) {
        logger.log(
          `VoiceConversation: Silence detected (${timeSinceLastAudio}ms), injecting trigger`
        );
        // Send special message to trigger silence response
        if (socket && socketState === 1) {
          const silenceMessage = {
            type: 'InjectUserMessage',
            content: 'USER_IS_SILENT_TRIGGER',
          };
          sendSocketMessage(socket, silenceMessage);
          logger.log('VoiceConversation: Injected silence trigger message');

          // Reset last audio time to prevent repeated triggers
          lastAudioTime.current = now;
        }
      }
    }, 1000); // Check every second
  }, [socket, socketState]);

  // Stop silence monitoring
  const stopSilenceMonitoring = useCallback(() => {
    logger.log('VoiceConversation: Stopping silence monitoring');
    if (silenceCheckInterval.current) {
      clearInterval(silenceCheckInterval.current);
      silenceCheckInterval.current = null;
    }
    if (silenceTimeout.current) {
      clearTimeout(silenceTimeout.current);
      silenceTimeout.current = null;
    }
  }, []);

  // Initialize playback AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
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
        try {
          source.stop();
        } catch (e) {}
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start conversation
  useEffect(() => {
    if (
      autoStart &&
      microphoneState === 1 &&
      !sessionActive &&
      !hasAutoStartedRef.current
    ) {
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

  // Monitor microphone data for audio levels
  useEffect(() => {
    if (microphone && socket && socketState === 1 && processor) {
      const originalOnaudioprocess = processor.onaudioprocess;

      processor.onaudioprocess = event => {
        // Get audio data for silence detection
        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);
        checkAudioLevels(channelData);

        // Call original handler
        if (originalOnaudioprocess) {
          originalOnaudioprocess.call(processor, event);
        }
      };
    }

    return () => {
      if (processor) {
        processor.onaudioprocess = sendMicToSocket(socket!);
      }
    };
  }, [microphone, socket, socketState, processor, checkAudioLevels]);

  // Start/stop silence monitoring with conversation
  useEffect(() => {
    if (sessionActive && isListening) {
      startSilenceMonitoring();
    } else {
      stopSilenceMonitoring();
    }

    return () => stopSilenceMonitoring();
  }, [
    sessionActive,
    isListening,
    startSilenceMonitoring,
    stopSilenceMonitoring,
  ]);

  // Handle Deepgram Messages (Audio & Events)
  useEffect(() => {
    if (!socket) return;

    const onMessage = async (event: MessageEvent) => {
      logger.log(
        `VoiceConversation: onMessage received, data type: ${typeof event.data}, length: ${event.data.length}`
      );
      if (event.data instanceof ArrayBuffer) {
        logger.log('VoiceConversation: Received audio data, processing...');
        // Audio Data
        if (audioContextRef.current) {
          const buffer = createAudioBuffer(audioContextRef.current, event.data);
          if (buffer) {
            const source = playAudioBuffer(
              audioContextRef.current,
              buffer,
              startTimeRef
            );
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
        logger.log('VoiceConversation: Received JSON message, parsing...');
        // JSON Message
        try {
          const msg = JSON.parse(event.data);
          logger.log('VoiceConversation: Parsed message:', msg);

          logger.debug('Deepgram Message:', msg);

          // DEBUG: Log ALL messages with key details
          logger.log(
            '%c🔍 📨 DEEPGRAM MESSAGE 📨🔍',
            'color: white; font-size: 20px; font-weight: bold; background: red; padding: 10px; border: 3px solid yellow;'
          );

          switch (msg.type) {
            case 'UserStartedSpeaking':
              // Reset silence timer on confirmed user speech start
              lastAudioTime.current = Date.now();

              setIsListening(false);
              setIsProcessing(true); // User speaking, agent thinking/listening
              setIsSpeaking(false);

              // Clear queued audio if user interrupts
              scheduledAudioSources.current.forEach(source => {
                try {
                  source.stop();
                } catch (e) {}
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
              // Give the child a fresh silence window after the agent stops speaking
              lastAudioTime.current = Date.now();
              break;

            case 'ConversationText':
              // Handle special silence trigger
              if (msg.content === 'USER_IS_SILENT_TRIGGER') {
                // Don't add to conversation history, but trigger agent response
                // The agent will respond based on the prompt instructions
                logger.log(
                  'VoiceConversation: Silence trigger detected, agent should respond'
                );
                break;
              }

              // DEBUG: Log message details
              logger.log('🔍 ConversationText received:', {
                role: msg.role,
                content: msg.content,
                contentLength: msg.content?.length,
              });

              // Add to conversation history
              const newMsg: ConversationMessage = {
                type: msg.role === 'user' ? 'user' : 'agent',
                text: msg.content,
                timestamp: new Date().toISOString(),
              };
              logger.log('🔍 Adding message to conversation:', newMsg);
              setConversation(prev => {
                const updated = [...prev, newMsg];
                logger.log('🔍 Conversation now has', updated.length);
                logger.log(
                  '🔍 User messages:',
                  updated.filter(m => m.type === 'user').length
                );

                // Store in localStorage for debugging
                try {
                  localStorage.setItem(
                    'debug_conversation',
                    JSON.stringify(updated)
                  );
                  localStorage.setItem(
                    'debug_conversation_timestamp',
                    Date.now().toString()
                  );
                } catch (e) {
                  logger.error(
                    'Failed to store conversation in localStorage:',
                    e
                  );
                }

                return updated;
              });

              // User just sent a message -> reset silence timer
              if (msg.role === 'user') {
                lastAudioTime.current = Date.now();
              }

              // Check if agent is ending the conversation (farewell phrases)
              if (msg.role === 'assistant') {
                const farewellPhrases = [
                  'bye',
                  'take care',
                  'stay safe',
                  'bye for now',
                  'see you later',
                  'goodbye',
                ];
                const isFarewell = farewellPhrases.some(phrase =>
                  msg.content.toLowerCase().includes(phrase.toLowerCase())
                );

                if (isFarewell) {
                  // End conversation after agent finishes speaking
                  setTimeout(() => {
                    endConversation();
                  }, 3000); // 3 second delay to allow farewell message to be spoken
                }
              }

              // Check if user is using farewell keywords
              if (msg.role === 'user') {
                const farewellPhrases = [
                  'bye',
                  'take care',
                  'stay safe',
                  'bye for now',
                  'see you later',
                  'goodbye',
                ];
                const isUserFarewell = farewellPhrases.some(phrase =>
                  msg.content.toLowerCase().includes(phrase.toLowerCase())
                );

                if (isUserFarewell) {
                  logger.log(
                    '%c🚨 USER USED FAREWELL KEYWORD 🚨',
                    'color: red; font-size: 24px; font-weight: bold; background: yellow; padding: 10px;'
                  );
                }
              }
              break;

            case 'EndOfThought':
              // Agent finished thinking
              break;

            case 'InjectionRefused':
              logger.log(
                'VoiceConversation: Silence injection refused - agent was speaking or user was talking'
              );
              // Reset the last audio time to try again later
              lastAudioTime.current = Date.now();
              break;

            default:
              break;
          }
        } catch (e) {
          logger.error('Error parsing Deepgram message', e);
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

      if (!disableConnection) {
        // Connect to Deepgram
        await connectToDeepgram();
      } else {
        // Skip connection for development/styling
        logger.log('VoiceConversation: Connection disabled for development');
        setTimeout(() => {
          setIsConnecting(false);
          setSessionActive(true);
          setIsListening(true);
          if (stopConnectingSoundRef.current) {
            stopConnectingSoundRef.current();
            stopConnectingSoundRef.current = null;
          }
        }, 2000); // Simulate connection time
      }
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
    logger.log(
      `VoiceConversation: socketState changed to ${socketState}, isConnecting: ${isConnecting}`
    );
    if (socketState === 1 && isConnecting) {
      logger.log('VoiceConversation: Socket connected, sending configuration');
      // Connected
      setIsConnecting(false);
      setSessionActive(true);
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }

      // Send Configuration
      logger.log('VoiceConversation: Generating system prompt...');
      const ageTierLabel = CONFIG.AGE_TIER_TO_PROMPT[ageTier];

      // Build conversation history context
      const conversationContext =
        conversation.length > 0
          ? conversation.map(msg => ({
              type: 'History' as const,
              role:
                msg.type === 'user'
                  ? ('user' as const)
                  : ('assistant' as const),
              content: msg.text,
            }))
          : [];

      const instructions =
        situation === 'ambulance'
          ? getAmbulancePrompt(
              ageTierLabel,
              CONFIG.MAX_CONVERSATION_TIME_MINUTES
            )
          : situation === 'fire'
            ? getFirePrompt(ageTierLabel, CONFIG.MAX_CONVERSATION_TIME_MINUTES)
            : getPolicePrompt(
                ageTierLabel,
                CONFIG.MAX_CONVERSATION_TIME_MINUTES
              );
      logger.log(
        'VoiceConversation: System prompt generated, length:',
        instructions.length
      );

      // Dynamic greeting based on scenario
      const greeting =
        situation === 'ambulance'
          ? "Hi, I'm Bobby from Ambulance Service. Is the patient breathing?"
          : situation === 'fire'
            ? "Hi, I'm Bobby from Fire and Rescue. What is the problem?"
            : "Hi, I'm Bobby from Police. What's wrong?";

      const config: DeepgramAgentConfig = {
        type: 'Settings',
        audio: {
          input: {
            encoding: 'linear16',
            sample_rate: 16000,
          },
          output: {
            encoding: 'linear16',
            sample_rate: 24000,
            container: 'none',
          },
        },
        agent: {
          language: 'en',
          context: {
            messages: conversationContext,
          },
          listen: {
            provider: {
              type: 'deepgram',
              model: 'nova-3',
            },
          },
          think: {
            provider: {
              type: 'open_ai',
              model: 'gpt-4.1-mini',
              temperature: 0.4,
              // model: "gpt-4o-mini",
            },
            prompt: instructions,
          },
          // type: "UpdateSpeak",
          speak: {
            provider: {
              type: 'eleven_labs',
              // type: 'cartesia',
              model_id: 'eleven_multilingual_v2',
              voice_id: 'lUTamkMw7gOzZbFIwmq4',
              voice: {
                mode: 'id',
                id: 'lUTamkMw7gOzZbFIwmq4',
              },
              // model_id: 'sonic-2',
              // voice: {
              //   mode: 'id',
              //   id: '726d5ae5-055f-4c3d-8355-d9677de68937',
              // },
              // speed: settings.slowedSpeech ? 0.7 : 1.0,
            },
          },
          greeting: greeting,
        },
      };

      logger.log(
        'VoiceConversation: Config created:',
        JSON.stringify(config, null, 2)
      );

      if (socket) {
        logger.log('VoiceConversation: Sending Settings message to socket');
        sendSocketMessage(socket, config);

        logger.log('VoiceConversation: Starting microphone');
        startMicrophone();
        setIsListening(true);
      } else {
        logger.error(
          'VoiceConversation: Socket is null when trying to send config'
        );
      }
    } else if (socketState === 2) {
      logger.log('VoiceConversation: Socket error state detected');
      // Error
      if (isConnecting) {
        setIsConnecting(false);
        setError('Connection to voice server failed.');
        if (stopConnectingSoundRef.current) {
          stopConnectingSoundRef.current();
          stopConnectingSoundRef.current = null;
        }
      }
    }
  }, [socketState, isConnecting, socket, ageTier, situation, startMicrophone]);

  const endConversation = useCallback(async () => {
    try {
      logger.log(
        '%c🎉 CONVERSATION ENDED 🎉',
        'color: green; font-size: 24px; font-weight: bold; background: lightgreen; padding: 10px;'
      );

      // DEBUG: Check localStorage for conversation
      const storedConversation = localStorage.getItem('debug_conversation');
      logger.log('🔍 Stored conversation in localStorage:', storedConversation);

      // DEBUG: Log conversation state before ending
      logger.log(
        '🔍 ENDING CONVERSATION - Total messages:',
        conversation.length
      );
      logger.log(
        '🔍 User messages:',
        conversation.filter(m => m.type === 'user').length
      );
      logger.log(
        '🔍 Agent messages:',
        conversation.filter(m => m.type === 'agent').length
      );
      logger.log('🔍 Full conversation:', conversation);

      // CRITICAL FIX: If conversation state is empty but localStorage has data, use localStorage
      let finalConversation = conversation;
      if (conversation.length === 0 && storedConversation) {
        try {
          const parsed = JSON.parse(storedConversation);
          if (Array.isArray(parsed) && parsed.length > 0) {
            logger.log(
              '🔍 ⚠️ USING LOCALSTORAGE CONVERSATION (state was empty):',
              parsed.length
            );
            finalConversation = parsed;
          }
        } catch (e) {
          logger.error('Failed to parse stored conversation:', e);
        }
      }

      disconnectFromDeepgram();

      // Stop audio
      scheduledAudioSources.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {}
      });
      scheduledAudioSources.current = [];

      setIsSpeaking(false);
      setIsListening(false);
      setConversationEnded(true);

      // Play end sound
      playEndConversationSound(soundEnabled);

      // Complete
      if (onComplete) {
        logger.log(
          '🔍 Calling onComplete with conversation:',
          finalConversation
        );
        onComplete(finalConversation);
      }
    } catch (err) {
      logger.error('Error ending conversation', err);
    }
  }, [
    conversation,
    disconnectFromDeepgram,
    soundEnabled,
    onComplete,
    setIsSpeaking,
    setIsListening,
    setConversationEnded,
  ]);

  // Component: ConnectionError
  function ConnectionError() {
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
              <CartoonButton
                onClick={onBack}
                ariaLabel="Go back to previous step"
              >
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

  // Component: ConversationEndingView
  function ConversationEndingView() {
    return (
      <div
        className="conversation-ending"
        style={{ textAlign: 'center', padding: '2rem' }}
      >
        <LoadingSpinner text="" heading="Processing your conversation..." />
      </div>
    );
  }

  // Component: SessionError
  function SessionError() {
    return (
      <div
        className="session-error"
        role="alert"
        style={{ textAlign: 'center', padding: '2rem' }}
      >
        <h3>Session Error</h3>
        <p>Something went wrong during the conversation.</p>
        <p className="error-details">{error}</p>
        <div className="error-action-buttons" style={{ marginTop: '1rem' }}>
          <CartoonButton
            onClick={() => void endConversation()}
            ariaLabel="End conversation"
            className="cartoon-btn-danger"
          >
            End Conversation
          </CartoonButton>
        </div>
      </div>
    );
  }

  if (error && !sessionActive) {
    return <ConnectionError />;
  }

  return (
    <div
      className="voice-conversation"
      role="region"
      aria-label="Voice conversation"
    >
      {/*<ConversationHeader />*/}
      {conversationEnded && <ConversationEndingView />}
      {!conversationEnded && sessionActive && (
        <ActiveConversationView
          visualState={visualState}
          settings={settings}
          conversation={conversation}
          sessionActive={sessionActive}
          remainingTime={remainingTime}
          endConversation={endConversation}
        />
      )}
      {!conversationEnded && !sessionActive && <LoadingSpinner />}
      {error && sessionActive && <SessionError />}
    </div>
  );
}
