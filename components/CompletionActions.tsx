'use client';

import { useRouter } from 'next/navigation';
import { useSecureSession } from '@/hooks/useSecureSession';
import { ROUTES } from '@/lib/routes';

interface CompletionActionsProps {
  conversationId?: string | null;
}

export default function CompletionActions({
  conversationId,
}: CompletionActionsProps) {
  const router = useRouter();
  const { clearSession } = useSecureSession();

  const handleContinue = async () => {
    await clearSession();
    router.push(ROUTES.YOUR_AGE);
  };

  const handleViewAchievements = () => {
    router.push(ROUTES.ACHIEVEMENTS);
  };

  const handleViewConversation = () => {
    router.push(
      conversationId ? `${ROUTES.CHATS}/${conversationId}` : ROUTES.CHATS
    );
  };

  return (
    <div className="completion-actions">
      <button
        onClick={handleContinue}
        className="cartoon-btn"
        aria-label="Practice again"
      >
        <span>Practice Again</span>
      </button>
      <button
        onClick={handleViewAchievements}
        className="cartoon-btn cartoon-btn--secondary"
        aria-label="View achievements"
      >
        <span>View Achievements</span>
      </button>
      <button
        onClick={handleViewConversation}
        className="cartoon-btn cartoon-btn--tertiary"
        aria-label="View conversation history"
      >
        <span>View Conversation</span>
      </button>
    </div>
  );
}

