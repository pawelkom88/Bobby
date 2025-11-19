'use client';

import { useState, useEffect, useRef } from 'react';
import { Conversation } from '@elevenlabs/client';
import {
  startAgentConversation,
  onAgentResponse,
  endAgentConversation,
  checkMicrophonePermission,
  handleElevenLabsError,
  getInputFrequencyData,
  startSpeechToText,
  sendTextToAgent,
} from '@/lib/elevenlabs-agent';
import { getSettings } from '@/lib/storage';
import { sanitizeText } from '@/lib/validation';
import { logger } from '@/lib/logger';
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
 * Voice conversation component with microphone and ElevenLabs integration
 */
export default function VoiceConversation({
  ageTier,
  situation,
  onComplete,
  onBack,
  autoStart = false,
}: VoiceConversationProps) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [agentConnected, setAgentConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const conversationRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const stopSpeechRecognitionRef = useRef<(() => void) | null>(null);
  const stopConnectingSoundRef = useRef<(() => void) | null>(null);

  const settings = getSettings();
  const { soundEnabled } = useSound();


  // Auto-start conversation when component mounts with autoStart flag
  useEffect(() => {
    // Check microphone permission on mount
    checkMicrophonePermission()
      .then((granted) => {
        setPermissionGranted(granted);
        if (!granted) {
          setPermissionError(
            'Microphone access is required for voice chat. Please allow microphone access in your browser settings.'
          );
        }
      })
      .catch((err) => {
        logger.error('Microphone permission check failed', err);
        setPermissionError('Could not check microphone access. Please allow it in your browser settings.');
      });

    return () => {
      // Cleanup on unmount
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (stopSpeechRecognitionRef.current) {
        stopSpeechRecognitionRef.current();
      }
      if (conversationRef.current) {
        endAgentConversation(conversationRef.current).catch((err) => {
          logger.error('Error cleaning up conversation', err);
        });
      }
    };
  }, []);

  // // Auto-start conversation if autoStart is true and permissions are granted
  useEffect(() => {
    if (autoStart && permissionGranted && !agentConnected) {
      logger.info('Auto-starting conversation');
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        void startConversation();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStart, permissionGranted, agentConnected]);

  const startConversation = async () => {
    if (!permissionGranted) {
      setPermissionError('Microphone permission is required for voice chat.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    // Start connecting sound (UI SFX)
    if (stopConnectingSoundRef.current) {
      stopConnectingSoundRef.current();
      stopConnectingSoundRef.current = null;
    }
    stopConnectingSoundRef.current = startConnectingSound(soundEnabled);

        try {
          const agentId = process.env.NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID;
          if (!agentId) {
            throw new Error('Agent ID not configured. Set NEXT_PUBLIC_ELEVEN_LABS_AGENT_ID in .env.local');
          }

      logger.info('Starting ElevenLabs agent conversation', { agentId });

      // Start real-time conversation with ElevenLabs agent
      const conv = await startAgentConversation(agentId);
      conversationRef.current = conv;

      // Set up listener for agent responses
      const unsubscribe = onAgentResponse(conv, (response) => {
        logger.debug('Agent responded', response);

        // Add agent message to conversation
        const agentMessage: ConversationMessage = {
          type: 'agent',
          text: response.text || 'I am listening...',
          timestamp: response.timestamp,
        };
        setConversation((prev) => [...prev, agentMessage]);
      });

      unsubscribeRef.current = unsubscribe;
      setAgentConnected(true);
      setIsConnecting(false);
      setIsListening(true);
      // Stop connecting sound once connected
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }

      // Start speech-to-text recognition
      const stopSpeechRecognition = startSpeechToText(
        (transcript, isFinal) => {
          logger.debug('Transcript received', { transcript, isFinal });

          if (isFinal && transcript) {
            // User finished speaking - send to agent
            setCurrentTranscript('');

            // Add user message to conversation
            const userMessage: ConversationMessage = {
              type: 'user',
              text: transcript,
              timestamp: new Date().toISOString(),
            };
            setConversation((prev) => [...prev, userMessage]);

            // Send to agent
            setIsLoading(true);
            sendTextToAgent(conv, transcript)
              .then((response) => {
                logger.debug('Agent response received', response);

                // Add agent message to conversation
                const agentMessage: ConversationMessage = {
                  type: 'agent',
                  text: response.text || 'Processing...',
                  timestamp: response.timestamp,
                };
                setConversation((prev) => [...prev, agentMessage]);
                setIsLoading(false);
              })
              .catch((err) => {
                logger.error('Error sending to agent', err);
                setError('Failed to process your speech. Please try again.');
                setIsLoading(false);
              });
          } else if (!isFinal) {
            // Interim transcript - show what user is saying
            setCurrentTranscript(transcript);
          }
        },
        (error) => {
          logger.error('Speech recognition error', error);
          setError(error);
        }
      );

      stopSpeechRecognitionRef.current = stopSpeechRecognition;

      logger.info('Voice conversation started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : '';
      console.error('Error starting conversation:', {
        message: errorMessage,
        stack: errorStack,
        error: err,
      });
      logger.error('Error starting conversation', { message: errorMessage, stack: errorStack });
      setError(handleElevenLabsError(err instanceof Error ? err : new Error(errorMessage)));
      setIsConnecting(false);
      setAgentConnected(false);
      // Stop connecting sound on error
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }
    }
  };

  const stopConversation = async () => {
    try {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (conversationRef.current) {
        await endAgentConversation(conversationRef.current);
        conversationRef.current = null;
      }

      setIsListening(false);
      setAgentConnected(false);
      logger.info('Voice conversation stopped');
    } catch (err) {
      logger.error('Error stopping conversation', err);
    }
  };

  const endConversation = () => {
    stopConversation();
    // Play end-of-conversation UI sound (does not affect agent audio policy)
    void playEndConversationSound(soundEnabled);
    if (onComplete) {
      onComplete(conversation);
    }
    // Clear transcript from state immediately after notifying parent
    setConversation([]);
    setCurrentTranscript('');
  };

  // // Keep connecting sound in sync with UI toggle while connecting
  useEffect(() => {
    if (!isConnecting) {
      if (stopConnectingSoundRef.current) {
        stopConnectingSoundRef.current();
        stopConnectingSoundRef.current = null;
      }
      return;
    }
    // isConnecting
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
          <p>This app requires microphone access to function. Please enable it in your browser settings and refresh the page.</p>
        </div>
      </div>
    );
  }

  if (error && !agentConnected) {
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
              onClick={() => window.location.href = '/'}
              ariaLabel="Return to home"
            >
              Home
            </CartoonButton>
            <CartoonButton
              onClick={() => window.location.href = '/contact'}
              ariaLabel="Contact us for support"
            >
              Contact Us
            </CartoonButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-conversation" role="region" aria-label="Voice conversation">
      <div className="conversation-header">
        {onBack && !agentConnected && (
          <button
            type="button"
            className="back-button"
            onClick={onBack}
            aria-label="Go back to dial pad"
          >
            ← Back
          </button>
        )}
      </div>
      <h1 className="conversation-subtitle">Just a moment ...</h1>
      <p className="conversation-subtitle-text">Bobby is getting ready to chat!</p>
      <br />
      <Image src="/bobby-connecting.png" alt="Bobby is getting ready to chat" width={200} height={250} />
      <br />
      {!agentConnected && (
        <div className="conversation-start-section">
          {isConnecting ? (
            <LoadingSpinner />
          ) : autoStart ? (
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

      {agentConnected && (
        <>
          <div className="conversation-status" aria-live="polite">
            {isLoading ? (
              <LoadingSpinner size="small" message="Bobby is thinking..." />
            ) : isListening ? (
              <span className="listening-indicator">🎤 Listening...</span>
            ) : (
              <span className="not-listening">Not listening</span>
            )}
          </div>

          <div className="conversation-messages" role="log" aria-live="polite" aria-label="Conversation messages">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`conversation-message ${message.type}`}
                role={message.type === 'user' ? 'user message' : 'agent message'}
              >
                <div className="message-text">{message.text}</div>
              </div>
            ))}
            {currentTranscript && (
              <div className="conversation-message user interim" aria-live="polite">
                <div className="message-text">{currentTranscript}</div>
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
              <CartoonButton
                onClick={stopConversation}
                ariaLabel="Stop listening"
              >
                Stop Listening
              </CartoonButton>
            ) : (
              <CartoonButton
                onClick={startConversation}
                ariaLabel="Start listening"
              >
                Start Listening
              </CartoonButton>
            )}
            <CartoonButton
              onClick={endConversation}
              ariaLabel="End conversation"
            >
              End Call
            </CartoonButton>
          </div>
        </>
      )}

      {error && agentConnected && (
        <div className="conversation-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

