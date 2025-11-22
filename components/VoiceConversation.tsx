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

interface VoiceConversationProps {
  ageTier?: AgeTier;
  situation?: Service;
  onComplete?: (conversation: ConversationMessage[]) => void;
  onBack?: () => void;
  autoStart?: boolean;
}

/**
 * Voice conversation component with Gemini AI and LemonFox TTS
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
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [remainingTime, setRemainingTime] = useState(CONFIG.SESSION_MAX_DURATION_SECONDS);
  const [geminiResponse, setGeminiResponse] = useState('');

  const stopSpeechRecognitionRef = useRef<(() => void) | null>(null);
  const shouldBeListeningRef = useRef(false);
  const stopConnectingSoundRef = useRef<(() => void) | null>(null);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoStartedRef = useRef(false);
  const abortLoopCounterRef = useRef(0);

  const settings = getSettings();
  const { soundEnabled } = useSound();

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
        logger.error('Speech recognition error', event.error);
        
        // "no-speech" error is common when waiting for user input
        // Just restart listening instead of showing error
        if (event.error === 'no-speech') {
          logger.info('No speech detected, restarting listening...');
          
          // Show gentle reminder to user
          setCurrentTranscript('💭 (Say something to help Bobby...)');
          
          // Restart after a brief delay
          setTimeout(() => {
            if (isSessionValid() && shouldBeListeningRef.current && !isProcessing) {
              startSpeechRecognition();
              setCurrentTranscript(''); // Clear reminder when listening restarts
            }
          }, 500);
        } else if (event.error === 'aborted') {
          // Aborted can happen if we stop it, or if the system stops it.
          // If we didn't stop it (shouldBeListening is true), it might be a system loop.
          if (shouldBeListeningRef.current) {
             abortLoopCounterRef.current += 1;
             logger.warn(`Speech recognition aborted (count: ${abortLoopCounterRef.current})`);
             
             if (abortLoopCounterRef.current > 5) {
                logger.error('Too many aborts, stopping auto-restart');
                shouldBeListeningRef.current = false;
                // Ensure we don't restart in onend by clearing any potentially queued timeouts or just relying on the ref
                setError('Speech recognition connection unstable. Please reload.');
             }
          }
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        logger.info('Speech recognition ended');
        setIsListening(false);
        
        // Auto-restart if we should be listening (and not processing/playing)
        // This handles "silence timeouts" or accidental stops where no final result was produced
        if (shouldBeListeningRef.current && !isProcessing && !isAudioPlaying()) {
            logger.info('Auto-restarting speech recognition after silence/end');
            // Small delay to prevent rapid loops
            setTimeout(() => {
                if (shouldBeListeningRef.current && !isProcessing && !isAudioPlaying()) {
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

    // Ensure we don't have multiple instances running or starting too fast
    if (isListening) {
        // If already listening, just return or stop and restart? 
        // For safety, let's stop existing one.
        try {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                // Try to find if there's a way to check existing instances? No.
                // Rely on stopSpeechRecognitionRef
            }
        } catch (e) { /* ignore */ }
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

            // Convert response to audio and play
            try {
              const audioBlob = await textToSpeech(fullResponse);
              await queueAndPlayAudio(audioBlob);
              // Audio finished - NOW restart listening for user
              logger.info('Audio finished, restarting speech recognition');
              shouldBeListeningRef.current = true;
              startSpeechRecognition();
            } catch (audioErr) {
              logger.error('Error playing audio', audioErr);
              // Restart listening even if audio fails
              shouldBeListeningRef.current = true;
              startSpeechRecognition();
            }
          },
        (error) => {
          logger.error('Gemini error', { error });
          setError(error);
          setGeminiResponse('');
        }
      );

      setIsProcessing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Error handling user input', { message });
      setError(message);
      setIsProcessing(false);
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
      shouldBeListeningRef.current = true;
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
        setIsProcessing(true);

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
              const audioBlob = await textToSpeech(fullResponse);
              await queueAndPlayAudio(audioBlob);
              
            // Audio has finished playing - NOW start listening for user input
            logger.info('Greeting audio finished, starting speech recognition');
            shouldBeListeningRef.current = true;
            startSpeechRecognition();
          } catch (audioErr) {
            logger.error('Error playing greeting audio', audioErr);
            // Still start listening even if audio fails
            shouldBeListeningRef.current = true;
            startSpeechRecognition();
          }
          },
          (error) => {
            logger.error('Greeting error', { error });
            setIsProcessing(false);
            // Start listening anyway
            startSpeechRecognition();
          }
        );
      } catch (greetingErr) {
        const message = greetingErr instanceof Error ? greetingErr.message : String(greetingErr);
        logger.error('Error getting greeting', { message });
        setIsProcessing(false);
        // Start listening anyway
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

      <h1 className="conversation-subtitle">Just a moment ...</h1>
      <p className="conversation-subtitle-text">Bobby is getting ready to chat!</p>
      <br />
      <Image src="/bobby-connecting.png" alt="Bobby is getting ready to chat" width={200} height={250} />
      <br />

      {!sessionActive && (
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
      )}

      {sessionActive && (
        <>
          <div className="conversation-status" aria-live="polite">
            {isProcessing ? (
              <LoadingSpinner size="small" message="Bobby is thinking..." />
            ) : isListening ? (
              <span className="listening-indicator">🎤 Listening...</span>
            ) : (
              <span className="not-listening">Ready to listen</span>
            )}
          </div>

          <div
            className="conversation-messages"
            role="log"
            aria-live="polite"
            aria-label="Conversation messages"
          >
            {conversation.map((message, index) => (
              <div key={index} className={`conversation-message ${message.type}`}>
                <div className="message-text">{message.text}</div>
              </div>
            ))}
            {currentTranscript && (
              <div className="conversation-message user interim" aria-live="polite">
                <div className="message-text">{currentTranscript}</div>
              </div>
            )}
            {geminiResponse && (
              <div className="conversation-message agent streaming">
                <div className="message-text">{geminiResponse}</div>
              </div>
            )}
          </div>

          {settings.subtitles && conversation.length > 0 && (
            <div className="subtitles" role="region" aria-label="Subtitles">
              {conversation
                .filter((msg) => msg.type === 'agent')
                .map((msg, index) => (
                  <p key={index} className="subtitle-text">
                    {msg.text}
                  </p>
                ))}
            </div>
          )}

          <div className="conversation-controls">
            {isListening ? (
              <CartoonButton onClick={stopConversation} ariaLabel="Stop listening">
                Stop Listening
              </CartoonButton>
            ) : (
              <CartoonButton onClick={startSpeechRecognition} ariaLabel="Start listening">
                Start Listening
              </CartoonButton>
            )}
            <CartoonButton onClick={() => void endConversation()} ariaLabel="End conversation">
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
