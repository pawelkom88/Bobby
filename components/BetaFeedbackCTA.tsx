'use client';

import { useTranslations } from 'next-intl';
import { useCredits } from '@/context/CreditsContext';
import { ROUTES } from '@/lib/routes';
import CartoonButton from './CartoonButton';

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
    const feedbackUrl = conversationId
      ? `${ROUTES.BETA_FEEDBACK}?conversationId=${conversationId}`
      : ROUTES.BETA_FEEDBACK;

    window.location.href = feedbackUrl;
  };

  return (
    <section className="completion-section beta-feedback-cta-section">
      <div className="beta-feedback-cta-card">
        <div className="beta-feedback-cta-content">
          <h2 className="beta-feedback-cta-title">{t('helpUsImprove')}</h2>
          <p className="beta-feedback-cta-description">
            {t('feedbackDescription')}
          </p>
          <br />
          <CartoonButton
            onClick={handleFeedbackClick}
            ariaLabel={t('ctaAriaLabel')}
            className="beta-feedback-cta-button cartoon-btn-danger"
          >
            {t('ctaButton')}
          </CartoonButton>
        </div>
      </div>
    </section>
  );
}
