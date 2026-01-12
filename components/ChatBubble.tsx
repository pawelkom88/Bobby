'use client';

import type { ConversationMessage } from '@/types';

interface ChatBubbleProps {
  message: ConversationMessage;
  showTimestamp?: boolean;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();
}

export default function ChatBubble({ message, showTimestamp = false }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble-wrapper chat-bubble-wrapper--${message.type}`}>
      <div className={`chat-bubble chat-bubble--${message.type}`}>
        <p className="chat-bubble__text">{message.text}</p>
        <div className="chat-bubble__tail" aria-hidden="true" />
      </div>
      {showTimestamp && (
        <span className="chat-bubble__timestamp">
          {formatTime(message.timestamp)}
        </span>
      )}
    </div>
  );
}
