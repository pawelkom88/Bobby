'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useClearSession } from '@/hooks/mutations/useSessionMutations';
import { ROUTES } from '@/lib/routes';

interface CompletionActionsProps {
  conversationId?: string | null;
}

export default function CompletionActions({
  conversationId,
}: CompletionActionsProps) {
  const t = useTranslations('completionActions');
  const router = useRouter();
  const clearSession = useClearSession();

  const handleContinue = async () => {
    await clearSession.mutateAsync();
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
        aria-label={t('practiceAgain')}
      >
        <span>{t('practiceAgain')}</span>
      </button>
      <button
        onClick={handleViewAchievements}
        className="cartoon-btn cartoon-btn--secondary"
        aria-label={t('viewAchievements')}
      >
        <span>{t('viewAchievements')}</span>
      </button>
      <button
        onClick={handleViewConversation}
        className="cartoon-btn cartoon-btn--tertiary"
        aria-label={t('viewConversation')}
      >
        <span>{t('viewConversation')}</span>
      </button>
    </div>
  );
}

