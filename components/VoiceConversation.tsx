'use client';

import { useState, useEffect, useRef } from 'react';
import { requestMicrophonePermission, createSpeechRecognition, startSpeechRecognition } from '@/lib/speech';
import { isElevenLabsConfigured, connectToAgent, sendMessageToAgent, handleElevenLabsError, playAudioResponse } from '@/lib/elevenlabs';
import { getSettings } from '@/lib/storage';
import LoadingSpinner from './LoadingSpinner';
import type { AgeTier, Service, AgentConnection } from '@/types';

interface ConversationMessage {
  type: 'user' | 'agent';
  text: string;
  timestamp: string;
}

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
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [agentConnected, setAgentConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const recognitionRef = useRef<ReturnType<typeof createSpeechRecognition>>(null);
  const agentConnectionRef = useRef<AgentConnection | null>(null);
  const stopRecognitionRef = useRef<(() => void) | null>(null);

  const settings = getSettings();

  useEffect(() => {
    // Request microphone permission on mount
    requestMicrophonePermission()
      .then((granted) => {
        setPermissionGranted(granted);
        if (!granted) {
          setPermissionError('Microphone access is required for this app to work. Please enable microphone permissions in your browser settings.');
        }
      })
      .catch((err) => {
        setPermissionError('Could not access microphone. Please check your browser settings.');
        console.error('Microphone permission error:', err);
      });

    // Check ElevenLabs configuration
    if (!isElevenLabsConfigured()) {
      setError('ElevenLabs is not configured. Please check your API key.');
    }

    return () => {
      // Cleanup
      if (stopRecognitionRef.current) {
        stopRecognitionRef.current();
      }
    };
  }, []);

  const startConversation = async () => {
    if (!permissionGranted) {
      setPermissionError('Microphone permission is required.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Connect to agent
      const connection = await connectToAgent();
      agentConnectionRef.current = connection;
      setAgentConnected(true);
      setIsConnecting(false);

      // Initialize speech recognition
      const recognition = createSpeechRecognition({
        continuous: true,
        interimResults: true,
        lang: 'en-GB',
      });

      if (!recognition) {
        setError('Speech recognition is not available in your browser.');
        return;
      }

      recognitionRef.current = recognition;

      // Start speech recognition
      const stopFn = startSpeechRecognition(recognition, {
        onResult: async (result) => {
          if (result.interim) {
            setCurrentTranscript(result.interim);
          }
          
          if (result.final) {
            setCurrentTranscript('');
            // Add user message to conversation
            const userMessage: ConversationMessage = {
              type: 'user',
              text: result.final,
              timestamp: new Date().toISOString(),
            };
            setConversation((prev) => [...prev, userMessage]);

            // Send to agent and get response
            setIsLoading(true);
            try {
              const agentResponse = await sendMessageToAgent(connection, result.final);
              
              // Add agent response to conversation
              const agentMessage: ConversationMessage = {
                type: 'agent',
                text: agentResponse.text || 'I understand. Can you tell me more?',
                timestamp: new Date().toISOString(),
              };
              setConversation((prev) => [...prev, agentMessage]);

              // Play audio if available
              if (agentResponse.audio) {
                try {
                  await playAudioResponse(agentResponse.audio);
                } catch (audioError) {
                  console.error('Error playing audio:', audioError);
                  // Continue even if audio playback fails
                }
              }
              setIsLoading(false);
            } catch (err) {
              console.error('Error sending message to agent:', err);
              setError(handleElevenLabsError(err as Error));
              setIsLoading(false);
            }
          }
        },
        onError: (error) => {
          console.error('Speech recognition error:', error);
          setError('Speech recognition error. Please try again.');
        },
        onStart: () => {
          setIsListening(true);
        },
        onEnd: () => {
          setIsListening(false);
        },
      });

      stopRecognitionRef.current = stopFn;
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError(handleElevenLabsError(err as Error));
      setIsConnecting(false);
      setAgentConnected(false);
    }
  };

  const stopConversation = () => {
    if (stopRecognitionRef.current) {
      stopRecognitionRef.current();
      stopRecognitionRef.current = null;
    }
    setIsListening(false);
  };

  const endConversation = () => {
    stopConversation();
    if (onComplete) {
      onComplete(conversation);
    }
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

