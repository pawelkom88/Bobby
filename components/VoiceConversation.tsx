'use client';

import { useState, useEffect, useRef } from 'react';
import {
  startGeminiSession,
  endGeminiSession,
  sendMessageToGemini,
  getRemainingSessionTime,
  getConversationHistory,
  isSessionValid,
} from '@/lib/gemini-conversation';
import {
  textToSpeech,
  queueAndPlayAudio,
  stopAllAudio,
  isAudioPlaying,
} from '@/lib/lemonfox-audio';
import { assessWithGemini } from '@/lib/assessment';
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

interface VoiceConversationProps {
  ageTier?: AgeTier;
  situation?: Service;
  onComplete?: (conversation: ConversationMessage[]) => void;
  onBack?: () => void;
  autoStart?: boolean;
}

/**
 * Voice conversation component with Gemini AI and LemonFox TTS
 * Refactored for Hands-Free Mode with Visual Feedback
 */
export default function VoiceConversation({
  ageTier = 1,
  situation = 'fire',
  onComplete,
  onBack,
  autoStart = false,
}: VoiceConversationProps) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // State Machine
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI Speaking
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [remainingTime, setRemainingTime] = useState(CONFIG.SESSION_MAX_DURATION_SECONDS);
  const [geminiResponse, setGeminiResponse] = useState('');

  const stopSpeechRecognitionRef = useRef<(() => void) | null>(null);
  const shouldBeListeningRef = useRef(false);
  const stopConnectingSoundRef = useRef<(() => void) | null>(null);
  const hasAutoStartedRef = useRef(false);
  const abortLoopCounterRef = useRef(0);

  const settings = getSettings();
  const { soundEnabled } = useSound();

  // Derived visual state
  const visualState: 'listening' | 'processing' | 'speaking' | 'error' | 'idle' = 
    error ? 'error' :
    isProcessing ? 'processing' :
    isSpeaking ? 'speaking' :
    isListening ? 'listening' :
    'idle';

  // Check microphone permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          setPermissionGranted(true);
        })
        .catch(() => {
          setPermissionError(
            'Microphone access is required for voice chat. Please allow microphone access in your browser settings.'
          );
        });
    }

    return () => {
      // Cleanup on unmount
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
      }
      if (stopSpeechRecognitionRef.current) {
        stopSpeechRecognitionRef.current();
      }
      stopAllAudio();
      if (sessionActive) {
        endGeminiSession();
      }
    };
  }, [sessionActive]);

  // Auto-start conversation if autoStart is true and permissions are granted
  useEffect(() => {
    if (autoStart && permissionGranted && !sessionActive && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      const timer = setTimeout(() => {
        void startConversation();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStart, permissionGranted, sessionActive]);

  // Update remaining time every second
  useEffect(() => {
    if (!sessionActive) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = getRemainingSessionTime();
      setRemainingTime(remaining);

      // Auto-end session if time is up
      if (remaining <= 0) {
        void endConversation();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive]);

  // Start Web Speech API recognition
  function startSpeechRecognition(): void {
    // If we shouldn't be listening, don't start
    if (!shouldBeListeningRef.current) return;

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError('Speech Recognition not supported in your browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Stop after each user input - don't listen while audio plays
      recognition.interimResults = true;
      recognition.lang = 'en-GB';

      recognition.onstart = () => {
        logger.info('Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        abortLoopCounterRef.current = 0; // Reset abort counter on successful result
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

        if (interimTranscript) {
          setCurrentTranscript(interimTranscript);
        }

        if (finalTranscript) {
          const sanitized = finalTranscript.trim();
          logger.debug('Final transcript', { sanitized });
          setCurrentTranscript('');

          // Send to Gemini
          void handleUserInput(sanitized);
        }
      };

      recognition.onerror = (event: any) => {
        // "no-speech" error is common when waiting for user input
        // Just restart listening instead of showing error
        if (event.error === 'no-speech') {
          logger.info('No speech detected, restarting listening...');
          
          // Restart after a brief delay if we should still be listening
          setTimeout(() => {
            if (isSessionValid() && shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
              startSpeechRecognition();
            }
          }, 300);
        } else if (event.error === 'aborted') {
          if (shouldBeListeningRef.current) {
             abortLoopCounterRef.current += 1;
             // Only retry a few times rapidly, otherwise wait
             if (abortLoopCounterRef.current < 5) {
                 setTimeout(() => {
                    if (shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
                        startSpeechRecognition();
                    }
                 }, 500);
             } else {
                 logger.warn('Too many aborts, pausing restart');
             }
          }
        } else {
          logger.error('Speech recognition error', event.error);
          // Don't show error to user for minor glitches, try to recover
          if (event.error !== 'not-allowed') {
             setTimeout(() => {
                if (shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
                    startSpeechRecognition();
                }
             }, 1000);
          } else {
             setError(`Speech recognition error: ${event.error}`);
          }
        }
      };

      recognition.onend = () => {
        logger.info('Speech recognition ended');
        setIsListening(false);
        
        // Auto-restart if we should be listening (and not processing/playing)
        // This handles "silence timeouts" or accidental stops where no final result was produced
        if (shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
            logger.info('Auto-restarting speech recognition after silence/end');
            setTimeout(() => {
                if (shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
                    startSpeechRecognition();
                }
            }, 300);
        }
      };

      recognition.start();
      stopSpeechRecognitionRef.current = () => {
        recognition.stop();
      };
    } catch (err) {
      logger.error('Error starting speech recognition', err);
      setError('Failed to start speech recognition');
    }
  }

  // Handle user input - send to Gemini
  async function handleUserInput(userText: string): Promise<void> {
    if (!userText.trim()) {
      return;
    }

    // Stop listening while processing
    shouldBeListeningRef.current = false;
    if (stopSpeechRecognitionRef.current) {
      stopSpeechRecognitionRef.current();
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        type: 'user',
        text: userText,
        timestamp: new Date().toISOString(),
      };
      setConversation((prev) => [...prev, userMessage]);

      // Send to Gemini and stream response
      let geminiText = '';
      setGeminiResponse('');

      await sendMessageToGemini(
        userText,
        (chunk) => {
          geminiText += chunk;
          setGeminiResponse(geminiText);
        },
        async (fullResponse) => {
            logger.debug('Gemini response complete', { length: fullResponse.length });

            // Add agent message to conversation FIRST
            const agentMessage: ConversationMessage = {
              type: 'agent',
              text: fullResponse,
              timestamp: new Date().toISOString(),
            };
            setConversation((prev) => [...prev, agentMessage]);
            setGeminiResponse('');
            setIsProcessing(false); // Thinking done, now speaking

            // Convert response to audio and play
            try {
              setIsSpeaking(true);
              const audioBlob = await textToSpeech(fullResponse);
              await queueAndPlayAudio(audioBlob);
              setIsSpeaking(false);
              
              // Audio finished - NOW restart listening for user
              logger.info('Audio finished, restarting speech recognition');
              shouldBeListeningRef.current = true;
              startSpeechRecognition();
            } catch (audioErr) {
              logger.error('Error playing audio', audioErr);
              setIsSpeaking(false);
              // Restart listening even if audio fails
              shouldBeListeningRef.current = true;
              startSpeechRecognition();
            }
          },
        (error) => {
          logger.error('Gemini error', { error });
          setError(error);
          setGeminiResponse('');
          setIsProcessing(false);
          // Try to recover listening
          shouldBeListeningRef.current = true;
          startSpeechRecognition();
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Error handling user input', { message });
      setError(message);
      setIsProcessing(false);
      // Try to recover
      shouldBeListeningRef.current = true;
      startSpeechRecognition();
    }
  }

  const startConversation = async () => {
    if (!permissionGranted) {
      setPermissionError('Microphone permission is required for voice chat.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Start connecting sound
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
      }
      stopConnectingSoundRef.current = startConnectingSound(soundEnabled);

      // Initialize Gemini session
      startGeminiSession({ ageTier, scenario: situation });
      setSessionActive(true);
      setIsConnecting(false);
      setRemainingTime(CONFIG.SESSION_MAX_DURATION_SECONDS);

      // Stop connecting sound
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }

      // Get initial greeting from dispatcher
      try {
        let greetingResponse = '';
        setIsProcessing(true); // Showing thinking initially

        await sendMessageToGemini(
          '', // Empty message to trigger greeting
          (chunk) => {
            greetingResponse += chunk;
            setGeminiResponse(greetingResponse);
          },
          async (fullResponse) => {
            logger.debug('Dispatcher greeting sent', { length: fullResponse.length });

            // Add greeting to conversation FIRST
            const greetingMessage: ConversationMessage = {
              type: 'agent',
              text: fullResponse,
              timestamp: new Date().toISOString(),
            };
            setConversation([greetingMessage]);
            setGeminiResponse('');
            setIsProcessing(false);

            // Convert greeting to audio and play
            try {
              setIsSpeaking(true);
              const audioBlob = await textToSpeech(fullResponse);
              await queueAndPlayAudio(audioBlob);
              setIsSpeaking(false);
              
              // Audio has finished playing - NOW start listening for user input
              logger.info('Greeting audio finished, starting speech recognition');
              shouldBeListeningRef.current = true;
              startSpeechRecognition();
            } catch (audioErr) {
              logger.error('Error playing greeting audio', audioErr);
              setIsSpeaking(false);
              // Still start listening even if audio fails
              shouldBeListeningRef.current = true;
              startSpeechRecognition();
            }
          },
          (error) => {
            logger.error('Greeting error', { error });
            setIsProcessing(false);
            // Start listening anyway
            shouldBeListeningRef.current = true;
            startSpeechRecognition();
          }
        );
      } catch (greetingErr) {
        const message = greetingErr instanceof Error ? greetingErr.message : String(greetingErr);
        logger.error('Error getting greeting', { message });
        setIsProcessing(false);
        // Start listening anyway
        shouldBeListeningRef.current = true;
        startSpeechRecognition();
      }

      logger.info('Voice conversation started with Gemini + LemonFox');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Error starting conversation', { message });
      setError(message);
      setIsConnecting(false);

      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }
    }
  };

  const stopConversation = () => {
    shouldBeListeningRef.current = false;
    try {
      if (stopSpeechRecognitionRef.current) {
        stopSpeechRecognitionRef.current();
        stopSpeechRecognitionRef.current = null;
      }
      setIsListening(false);
    } catch (err) {
      logger.error('Error stopping conversation', err);
    }
  };

  const endConversation = async () => {
    try {
      stopConversation();
      stopAllAudio();
      setIsSpeaking(false);

      // Play end-of-conversation sound
      void playEndConversationSound(soundEnabled);

      // Get final conversation
      const finalConversation = getConversationHistory().map((msg) => ({
        type: msg.role === 'user' ? ('user' as const) : ('agent' as const),
        text: msg.content,
        timestamp: new Date().toISOString(),
      }));

      // End session
      endGeminiSession();
      setSessionActive(false);

      // Assessment will be done in parent component
      if (onComplete) {
        onComplete(finalConversation);
      }
    } catch (err) {
      logger.error('Error ending conversation', err);
    }
  };

  // Handle sound toggle while connecting
  useEffect(() => {
    if (!isConnecting) {
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }
      return;
    }

    if (soundEnabled) {
      if (!stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current = startConnectingSound(true);
      }
    } else {
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }
    }
  }, [isConnecting, soundEnabled]);

  if (permissionError) {
    return (
      <div className="voice-conversation" role="alert">
        <div className="permission-error">
          <h3>Microphone Required</h3>
          <p>{permissionError}</p>
        </div>
      </div>
    );
  }

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
          <div className="session-timer" aria-label={`Time remaining: ${remainingTime} seconds`}>
            <span className={remainingTime < 30 ? 'warning' : ''}>
              ⏱️ {remainingTime}s
            </span>
          </div>
        )}
      </div>

      {!sessionActive ? (
        <>
          <h1 className="conversation-subtitle">Just a moment ...</h1>
          <p className="conversation-subtitle-text">Bobby is getting ready to chat!</p>
          <br />
          <Image src="/bobby-connecting.png" alt="Bobby is getting ready to chat" width={200} height={250} />
          <br />

          <div className="conversation-start-section">
            {isConnecting ? (
              <LoadingSpinner />
            ) : (
              <CartoonButton
                onClick={startConversation}
                disabled={!permissionGranted || isConnecting}
                ariaLabel="Start conversation with Bobby"
              >
                Start Conversation
              </CartoonButton>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Main Visual Feedback Area */}
          <div className="conversation-visuals" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
             <h2 className="kavoon" style={{fontSize: '2rem', color: '#333'}}>
                {visualState === 'speaking' && "Bobby is speaking..."}
                {visualState === 'listening' && "Bobby is listening..."}
                {visualState === 'processing' && "Bobby is thinking..."}
                {visualState === 'error' && "Something went wrong"}
             </h2>
             
             <VoiceAnimations state={visualState} />
             
             {/* Current user transcript (subtitle) */}
             {currentTranscript && (
                <div className="live-transcript" style={{
                    minHeight: '30px',
                    fontSize: '1.2rem',
                    color: '#666',
                    fontStyle: 'italic'
                }}>
                    "{currentTranscript}"
                </div>
             )}
          </div>

          {/* Subtitles (Agent only) */}
          {settings.subtitles && conversation.length > 0 && (
            <div className="subtitles" role="region" aria-label="Subtitles" style={{
                marginTop: 'auto',
                marginBottom: '2rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '1rem',
                maxWidth: '80%'
            }}>
              {conversation
                .filter((msg) => msg.type === 'agent')
                .slice(-1) // Show only last message
                .map((msg, index) => (
                  <p key={index} className="subtitle-text" style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                    {msg.text}
                  </p>
                ))}
            </div>
          )}

          {/* Controls (Only End Call now) */}
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
