'use client';

import { useTranslations } from 'next-intl';
import { useCredits } from '@/context/CreditsContext';
import { ROUTES } from '@/lib/routes';
import CartoonButton from './CartoonButton';
import styles from './BetaFeedbackCTA.module.css';

interface BetaFeedbackCTAProps {
  conversationId?: string | null;
}

export default function BetaFeedbackCTA({
  conversationId,
}: BetaFeedbackCTAProps) {
  const t = useTranslations('betaFeedback');
  const { isBetaUser } = useCredits();

  // Only show for beta users
  if (!isBetaUser) {
    return null;
  }

  const handleFeedbackClick = () => {
    window.location.href = conversationId
      ? `${ROUTES.BETA_FEEDBACK}?conversationId=${conversationId}`
      : ROUTES.BETA_FEEDBACK;
  };

  return (
    <section
      className={`completion-section ${styles['beta-feedback-cta-section']}`}
    >
      <div className={styles['beta-feedback-cta-card']}>
        <div className={styles['beta-feedback-cta-content']}>
          <h2 className={styles['beta-feedback-cta-title']}>
            {t('helpUsImprove')}
          </h2>
          <p className={styles['beta-feedback-cta-description']}>
            {t('feedbackDescription')}
          </p>
          <CartoonButton
            onClick={handleFeedbackClick}
            ariaLabel={t('ctaAriaLabel')}
            className={`${styles['beta-feedback-cta-button']} cartoon-btn-danger`}
          >
            {t('ctaButton')}
          </CartoonButton>
        </div>
      </div>
    </section>
  );
}
