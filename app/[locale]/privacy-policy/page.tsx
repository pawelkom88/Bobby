'use client';

import { ViewTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import CartoonButton from '@/components/CartoonButton';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacyPolicy');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const homePath = `/${locale}`;

  return (
    <ViewTransition>
      <PageWrapper>
        <main className="settings-page" role="main">
          <header className="settings-header">
            <h1 className="settings-title">{t('title')}</h1>
          </header>

          <div className="settings-content">
            <section
              className="settings-section"
              aria-labelledby="privacy-intro-heading"
            >
              <h2 id="privacy-intro-heading" className="sr-only">
                {t('subtitle')}
              </h2>
              <p className="contact-subtitle-text">{t('subtitle')}</p>
              <p className="text-sm text-gray-600 mb-6">
                {t('lastUpdated', { date: 'December 30, 2024' })}
              </p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="what-we-collect-heading"
            >
              <h2
                id="what-we-collect-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('whatWeCollect.title')}
              </h2>
              <p className="mb-4">{t('whatWeCollect.intro')}</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>{t('whatWeCollect.accountInfo')}</li>
                <li>{t('whatWeCollect.purchaseInfo')}</li>
                <li>{t('whatWeCollect.usageData.title')}</li>
                <ul className="list-circle list-inside ml-6 space-y-1">
                  <li>{t('whatWeCollect.usageData.practiceCalls')}</li>
                  <li>{t('whatWeCollect.usageData.sessionDates')}</li>
                  <li>{t('whatWeCollect.usageData.transcripts')}</li>
                </ul>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="what-we-do-not-collect-heading"
            >
              <h2
                id="what-we-do-not-collect-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('whatWeDoNotCollect.title')}
              </h2>
              <p className="mb-3">{t('whatWeDoNotCollect.subtitle')}</p>
              <ul className="list-disc list-inside space-y-2">
                <li>{t('whatWeDoNotCollect.audio')}</li>
                <li>{t('whatWeDoNotCollect.phoneNumbers')}</li>
                <li>{t('whatWeDoNotCollect.location')}</li>
                <li>{t('whatWeDoNotCollect.advertising')}</li>
              </ul>
            </section>

            <section
              className="settings-section"
              aria-labelledby="practice-transcripts-heading"
            >
              <h2
                id="practice-transcripts-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('practiceTranscripts.title')}
              </h2>
              <p className="mb-2">{t('practiceTranscripts.intro')}</p>
              <p className="mb-4">{t('practiceTranscripts.explanation')}</p>
              <p className="mb-2">{t('practiceTranscripts.askNotToShare')}</p>
              <p className="mb-4">{t('practiceTranscripts.redaction')}</p>
              <p className="mb-4 font-semibold text-red-600">
                {t('practiceTranscripts.redactionDisclaimer')}
              </p>
              <p className="mb-4">{t('practiceTranscripts.retention')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="children-data-heading"
            >
              <h2
                id="children-data-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('childrensData.title')}
              </h2>
              <p className="mb-2">{t('childrensData.accountsManaged')}</p>
              <p className="mb-2">{t('childrensData.noAccounts')}</p>
              <p>{t('childrensData.noAudio')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="how-we-use-data-heading"
            >
              <h2
                id="how-we-use-data-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('howWeUseData.title')}
              </h2>
              <p className="mb-4">{t('howWeUseData.intro')}</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>{t('howWeUseData.provideAccess')}</li>
                <li>{t('howWeUseData.trackCredits')}</li>
                <li>{t('howWeUseData.allowReview')}</li>
                <li>{t('howWeUseData.improvePerformance')}</li>
                <li>{t('howWeUseData.compliance')}</li>
              </ul>
              <p>{t('howWeUseData.notUsed')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="payments-heading"
            >
              <h2 id="payments-heading" className="text-lg font-semibold mb-3">
                {t('payments.title')}
              </h2>
              <p className="mb-2">{t('payments.processedBy')}</p>
              <p>{t('payments.noCardDetails')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="analytics-heading"
            >
              <h2 id="analytics-heading" className="text-lg font-semibold mb-3">
                {t('analytics.title')}
              </h2>
              <p className="text-gray-600 italic">
                {t('analytics.noAnalytics')}
              </p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="data-sharing-heading"
            >
              <h2
                id="data-sharing-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('dataSharing.title')}
              </h2>
              <p className="mb-3">{t('dataSharing.noSale')}</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>{t('dataSharing.payment')}</li>
                <li>{t('dataSharing.authentication')}</li>
                <li>{t('dataSharing.hosting')}</li>
                <li>{t('dataSharing.voiceProviders')}</li>
              </ul>
              <p>{t('dataSharing.gdprCompliant')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="data-rights-heading"
            >
              <h2
                id="data-rights-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('dataRights.title')}
              </h2>
              <p className="mb-3">{t('dataRights.intro')}</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>{t('dataRights.access')}</li>
                <li>{t('dataRights.correction')}</li>
                <li>{t('dataRights.deletion')}</li>
                <li>{t('dataRights.portability')}</li>
              </ul>
              <p className="mb-2">{t('dataRights.howToDelete')}</p>
              <p>{t('dataRights.whatHappens')}</p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="practice-disclaimer-heading"
            >
              <h2
                id="practice-disclaimer-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('practiceDisclaimer.title')}
              </h2>
              <p className="mb-2">{t('practiceDisclaimer.educationalTool')}</p>
              <p className="font-semibold text-red-600">
                {t('practiceDisclaimer.emergencyNumbers')}
              </p>
            </section>

            <section
              className="settings-section"
              aria-labelledby="privacy-contact-heading"
            >
              <h2
                id="privacy-contact-heading"
                className="text-lg font-semibold mb-3"
              >
                {t('privacyContact.title')}
              </h2>
              <p>
                {t('privacyContact.questions', {
                  email: 'contact@readywithbobby.online',
                })}
              </p>
            </section>
          </div>

          <div className="settings-back-button">
            <CartoonButton asLink href={homePath}>
              {tCommon('back')}
            </CartoonButton>
          </div>
        </main>
      </PageWrapper>
    </ViewTransition>
  );
}
