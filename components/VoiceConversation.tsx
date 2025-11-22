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
import TimerDisplay from './TimerDisplay';

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
  const [audioMuted, setAudioMuted] = useState(false);
  
  // State Machine
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI Speaking
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
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
  const activeRecognitionRef = useRef<any>(null);
  const lastRecognitionStartRef = useRef<number>(0);
  const rapidRestartCountRef = useRef<number>(0);
  const isStartingRecognitionRef = useRef<boolean>(false);
  const sessionActiveRef = useRef<boolean>(false); // Track session state for callbacks

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
      if (sessionActiveRef.current) {
        endGeminiSession();
      }
    };
  }, []);

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
    const interval = setInterval(() => {
      if (!sessionActiveRef.current) {
        return;
      }
      
      const remaining = getRemainingSessionTime();
      setRemainingTime(remaining);

      // Auto-end session if time is up
      if (remaining <= 0 && sessionActiveRef.current) {
        void endConversation();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Start Web Speech API recognition
  function startSpeechRecognition(): void {
    logger.debug('startSpeechRecognition called', {
      shouldBeListening: shouldBeListeningRef.current,
      isStarting: isStartingRecognitionRef.current,
      hasActiveRecognition: !!activeRecognitionRef.current,
      isProcessing,
      isSpeaking,
      sessionActive
    });
    
    // If we shouldn't be listening, don't start
    if (!shouldBeListeningRef.current) {
      logger.debug('Not starting speech recognition - shouldBeListening is false');
      return;
    }

    // Prevent concurrent starts
    if (isStartingRecognitionRef.current) {
      logger.debug('Already starting recognition, skipping duplicate call');
      return;
    }

    // If already listening, don't start again
    if (activeRecognitionRef.current) {
      logger.debug('Recognition already active, skipping start');
      return;
    }

    logger.info('Initializing speech recognition');
    isStartingRecognitionRef.current = true;

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError('Speech Recognition not supported in your browser');
        isStartingRecognitionRef.current = false;
        return;
      }

      const recognition = new SpeechRecognition();
      activeRecognitionRef.current = recognition;

      recognition.continuous = false; // Stop after each user input - don't listen while audio plays
      recognition.interimResults = true;
      recognition.lang = 'en-GB';

      recognition.onstart = () => {
        logger.info('Speech recognition started');
        lastRecognitionStartRef.current = Date.now();
        isStartingRecognitionRef.current = false;
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        logger.debug('Speech recognition onresult fired', { 
          resultIndex: event.resultIndex, 
          resultsLength: event.results.length 
        });
        
        abortLoopCounterRef.current = 0; // Reset abort counter on successful result
        rapidRestartCountRef.current = 0; // Reset rapid restart counter on success
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          const confidence = event.results[i][0].confidence;

          logger.debug('Speech result', { 
            index: i, 
            isFinal, 
            confidence,
            transcript: transcript.substring(0, 50) // First 50 chars
          });

          if (isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          logger.debug('Interim transcript update', { 
            length: interimTranscript.length,
            preview: interimTranscript.substring(0, 50)
          });
          setCurrentTranscript(interimTranscript);
        }

        if (finalTranscript) {
          const sanitized = finalTranscript.trim();
          logger.info('Final transcript received', { 
            length: sanitized.length,
            text: sanitized 
          });
          setCurrentTranscript('');

          // Send to Gemini
          void handleUserInput(sanitized);
        } else {
          logger.debug('No final transcript in this result event');
        }
      };

      recognition.onerror = (event: any) => {
        isStartingRecognitionRef.current = false;

        // "no-speech" error is common when waiting for user input
          // Just restart listening instead of showing error
          if (event.error === 'no-speech') {
            logger.info('No speech detected, will restart after delay');

            // Restart after a brief delay if we should still be listening
            setTimeout(() => {
              if (sessionActiveRef.current && isSessionValid() && shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
                startSpeechRecognition();
              }
            }, 500);
          } else if (event.error === 'aborted') {
            if (shouldBeListeningRef.current && sessionActiveRef.current) {
            abortLoopCounterRef.current += 1;
            // Only retry a few times rapidly, otherwise wait
            if (abortLoopCounterRef.current < 5) {
              setTimeout(() => {
                if (sessionActiveRef.current && shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
                  startSpeechRecognition();
                }
              }, 800);
            } else {
              logger.warn('Too many aborts, longer backoff');
              // Back off longer
              setTimeout(() => {
                if (sessionActiveRef.current && shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
                  abortLoopCounterRef.current = 0;
                  startSpeechRecognition();
                }
              }, 3000);
            }
          }
        } else if (event.error === 'audio-capture') {
          logger.error('Audio capture error - microphone may be in use');
          setError('Microphone error. Please check if another app is using it.');
          shouldBeListeningRef.current = false;
        } else {
          logger.error('Speech recognition error', event.error);
          // Don't show error to user for minor glitches, try to recover
          if (event.error !== 'not-allowed') {
            setTimeout(() => {
              if (sessionActiveRef.current && shouldBeListeningRef.current && !isProcessing && !isSpeaking) {
                startSpeechRecognition();
              }
            }, 1500);
          } else {
            setError(`Speech recognition error: ${event.error}`);
            shouldBeListeningRef.current = false;
          }
        }
      };

      recognition.onend = () => {
        const duration = Date.now() - lastRecognitionStartRef.current;
        logger.info('Speech recognition ended', { 
          duration: `${duration}ms`,
          shouldBeListening: shouldBeListeningRef.current,
          isProcessing,
          isSpeaking,
          sessionActive
        });

        isStartingRecognitionRef.current = false;
        setIsListening(false);

        if (activeRecognitionRef.current === recognition) {
          activeRecognitionRef.current = null;
        }

        // Check for rapid restarts - if session lasted less than 1 second
        if (duration < 1000) {
          rapidRestartCountRef.current += 1;
        } else {
          rapidRestartCountRef.current = 0;
        }

        // Auto-restart if we should be listening (and not processing/playing)
        // This handles "silence timeouts" or accidental stops where no final result was produced
        if (shouldBeListeningRef.current && !isProcessing && !isSpeaking && sessionActiveRef.current && isSessionValid()) {

          let restartDelay = 500; // Increased base delay from 300ms

          if (rapidRestartCountRef.current > 3) {
            logger.warn('Rapid restart detected in onend, backing off', {
              count: rapidRestartCountRef.current,
              duration: `${duration}ms`
            });
            restartDelay = 3000; // Wait 3 seconds

            if (rapidRestartCountRef.current > 15) {
              logger.error('Too many rapid restarts, stopping speech recognition');
              setError('Microphone connection unstable. Please reload the page.');
              shouldBeListeningRef.current = false;
              return;
            }
          }

          logger.info('Auto-restarting speech recognition after silence/end', {
            restartDelay,
            rapidRestartCount: rapidRestartCountRef.current,
            reason: 'No final transcript received'
          });

          setTimeout(() => {
            if (shouldBeListeningRef.current && !isProcessing && !isSpeaking && !activeRecognitionRef.current && sessionActiveRef.current && isSessionValid()) {
              logger.debug('Executing delayed restart of speech recognition');
              startSpeechRecognition();
            } else {
              logger.debug('Skipped delayed restart', {
                shouldBeListening: shouldBeListeningRef.current,
                isProcessing,
                isSpeaking,
                hasActiveRecognition: !!activeRecognitionRef.current,
                sessionActive: sessionActiveRef.current
              });
            }
          }, restartDelay);
        } else {
          logger.debug('Not auto-restarting speech recognition', {
            shouldBeListening: shouldBeListeningRef.current,
            isProcessing,
            isSpeaking,
            sessionActive: sessionActiveRef.current,
            isValid: isSessionValid()
          });
        }
      };

      recognition.start();
      stopSpeechRecognitionRef.current = () => {
        try {
          if (recognition) {
            recognition.stop();
          }
        } catch (e) {
          logger.debug('Error stopping recognition', e);
        }
      };
    } catch (err) {
      logger.error('Error starting speech recognition', err);
      setError('Failed to start speech recognition');
      isStartingRecognitionRef.current = false;
      activeRecognitionRef.current = null;
    }
  }

  // Handle user input - send to Gemini
  async function handleUserInput(userText: string): Promise<void> {
    logger.info('handleUserInput called', { 
      textLength: userText.length,
      text: userText,
      sessionActive,
      sessionActiveRef: sessionActiveRef.current,
      isValid: isSessionValid()
    });
    
    if (!userText.trim()) {
      logger.warn('Empty user text, skipping');
      return;
    }

    // Check if session is still valid (prevents null reference errors)
    // Use ref to get current value, not stale closure value
    if (!sessionActiveRef.current || !isSessionValid()) {
      logger.warn('Cannot handle input - session not active or invalid', {
        sessionActiveRef: sessionActiveRef.current,
        isValid: isSessionValid()
      });
      return;
    }

    // Stop listening while processing
    logger.debug('Stopping speech recognition to process user input');
    shouldBeListeningRef.current = false;
    if (stopSpeechRecognitionRef.current) {
      stopSpeechRecognitionRef.current();
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      logger.info('Starting to process user input with Gemini');

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

      logger.info('Calling sendMessageToGemini', { userTextLength: userText.length });

      await sendMessageToGemini(
        userText,
        (chunk) => {
          geminiText += chunk;
          setGeminiResponse(geminiText);
          logger.debug('Gemini chunk received', { chunkLength: chunk.length, totalLength: geminiText.length });
        },
        async (fullResponse) => {
          logger.info('Gemini response complete', { 
            length: fullResponse.length,
            text: fullResponse.substring(0, 100) + (fullResponse.length > 100 ? '...' : '')
          });

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
          setIsSpeaking(true);
          
          try {
            logger.info('Starting TTS and audio playback for agent response', {
              responseLength: fullResponse.length
            });

            logger.info('Calling textToSpeech API');
            const audioBlob = await textToSpeech(fullResponse);
            logger.info('textToSpeech API completed successfully', { 
              blobSize: audioBlob.size,
              blobType: audioBlob.type 
            });

            logger.info('Calling queueAndPlayAudio to play response');
            await queueAndPlayAudio(audioBlob);
            logger.info('queueAndPlayAudio completed - audio played successfully');

            // Audio played successfully
            setAudioMuted(false);
          } catch (audioErr) {
            logger.error('Error in TTS or audio playback', { 
              error: audioErr,
              message: audioErr instanceof Error ? audioErr.message : String(audioErr)
            });
            
            // Notify user that audio is muted but conversation continues
            setAudioMuted(true);
            
            // Wait a bit to simulate audio duration so user can read the subtitle
            logger.info('Waiting 2 seconds for user to read subtitle');
            await new Promise(resolve => setTimeout(resolve, 2000));
          } finally {
            setIsSpeaking(false);
            
            // Always restart listening after response (audio or text-only)
            logger.info('Response complete, preparing to restart speech recognition', {
              shouldBeListening: shouldBeListeningRef.current,
              sessionActive,
              isValid: isSessionValid()
            });
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
      sessionActiveRef.current = true; // Update ref immediately for callbacks
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
            setIsSpeaking(true);
            
            try {
              logger.debug('Starting TTS and audio playback for greeting');

              logger.debug('Calling textToSpeech for greeting');
              const audioBlob = await textToSpeech(fullResponse);
              logger.debug('textToSpeech completed for greeting', { blobSize: audioBlob.size });

              logger.debug('Calling queueAndPlayAudio for greeting');
              await queueAndPlayAudio(audioBlob);
              logger.debug('queueAndPlayAudio completed for greeting - audio played successfully');

              // Audio played successfully
              setAudioMuted(false);
            } catch (audioErr) {
              logger.error('Error playing greeting audio', audioErr);
              
              // Notify user that audio is muted but conversation continues
              setAudioMuted(true);
              
              // Wait a bit to simulate audio duration so user can read the subtitle
              await new Promise(resolve => setTimeout(resolve, 2000));
            } finally {
              setIsSpeaking(false);
              
              // Always start listening after greeting (audio or text-only)
              logger.info('Greeting complete, starting speech recognition');
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
    isStartingRecognitionRef.current = false;

    try {
      if (stopSpeechRecognitionRef.current) {
        stopSpeechRecognitionRef.current();
        stopSpeechRecognitionRef.current = null;
      }
      if (activeRecognitionRef.current) {
        try {
          activeRecognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        activeRecognitionRef.current = null;
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
      setConversationEnded(true); // Mark as ended to prevent showing "getting ready" screen

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
      sessionActiveRef.current = false; // Update ref immediately

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
            {isConnecting &&
              <LoadingSpinner />}
          </div>
        </>
      ) : conversationEnded ? (
        <div className="conversation-ending" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Processing your conversation...</h2>
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Audio muted notification */}
          {audioMuted && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '0.75rem',
              marginBottom: '1rem',
              textAlign: 'center',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <p style={{ margin: 0, color: '#856404', fontSize: '0.95rem', fontWeight: '600' }}>
                🔇 Audio is muted by your browser - Reading Bobby's responses below
              </p>
            </div>
          )}

          {/* Main Visual Feedback Area */}
          <div className="conversation-visuals" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
            <h2 className="kavoon" style={{ fontSize: '2rem', color: '#333' }}>
              {visualState === 'speaking' && (audioMuted ? "Bobby is responding..." : "Bobby is speaking...")}
              {visualState === 'listening' && "Your turn to speak!"}
              {visualState === 'processing' && "Bobby is thinking..."}
              {visualState === 'error' && "Something went wrong"}
            </h2>

            <VoiceAnimations state={visualState} />
          </div>

          {/* Subtitles (Agent only) - Always show if audio is muted or if subtitles enabled */}
          {(settings.subtitles || audioMuted) && conversation.length > 0 && (
            <div className="subtitles" role="region" aria-label="Subtitles" style={{
              marginTop: 'auto',
              marginBottom: '2rem',
              padding: '1.25rem',
              background: audioMuted ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255,255,255,0.8)',
              border: audioMuted ? '2px solid #ffc107' : 'none',
              borderRadius: '1rem',
              maxWidth: '85%',
              boxShadow: audioMuted ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
            }}>
              {conversation
                .filter((msg) => msg.type === 'agent')
                .slice(-1) // Show only last message
                .map((msg, index) => (
                  <p key={index} className="subtitle-text" style={{ 
                    fontSize: audioMuted ? '1.3rem' : '1.2rem', 
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
