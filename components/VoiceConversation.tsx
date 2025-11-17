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
import type { AgeTier, Service, ConversationMessage } from '@/types';

interface VoiceConversationProps {
  ageTier?: AgeTier;
  situation?: Service;
  onComplete?: (conversation: ConversationMessage[]) => void;
}

/**
 * Voice conversation component with microphone and ElevenLabs integration
 */
export default function VoiceConversation({ ageTier, situation, onComplete }: VoiceConversationProps) {
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

  const settings = getSettings();

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

  const startConversation = async () => {
    if (!permissionGranted) {
      setPermissionError('Microphone permission is required for voice chat.');
      return;
    }

    setIsConnecting(true);
    setError(null);

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
    if (onComplete) {
      onComplete(conversation);
    }
    // Clear transcript from state immediately after notifying parent
    setConversation([]);
    setCurrentTranscript('');
  };

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
          <h3>Connection Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-conversation" role="region" aria-label="Voice conversation">
      <h2 className="conversation-title">CALL WITH BOBBY</h2>
      <p className="conversation-subtitle">Stay calm, you're doing great!</p>

      {!agentConnected && (
        <div className="conversation-start-section">
          {isConnecting ? (
            <LoadingSpinner message="Connecting to Bobby..." />
          ) : (
            <button
              type="button"
              className="start-conversation-button"
              onClick={startConversation}
              disabled={!permissionGranted || isConnecting}
              aria-label="Start conversation with Bobby"
            >
              Start Conversation
            </button>
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
              <button
                type="button"
                className="stop-button"
                onClick={stopConversation}
                aria-label="Stop listening"
              >
                Stop Listening
              </button>
            ) : (
              <button
                type="button"
                className="start-button"
                onClick={startConversation}
                aria-label="Start listening"
              >
                Start Listening
              </button>
            )}
            <button
              type="button"
              className="end-button"
              onClick={endConversation}
              aria-label="End conversation"
            >
              End Call
            </button>
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

