'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Image from 'next/image';

export default function ParentGuidePage() {
  const t = useTranslations('landing');

  return (
    <PageWrapper>
      <ErrorBoundary>
        <div className="parent-guide-container">
          <div className="parent-guide-wrapper">
            <div className="parent-guide-header">
              <h1 className="parent-guide-title">{t('parentGuide.title')}</h1>
              <p className="parent-guide-subtitle">{t('parentGuide.subtitle')}</p>
            </div>

            <div className="parent-guide-content">
              <section className="guide-section">
                <h2>{t('parentGuide.gettingStarted.title')}</h2>
                <div className="guide-card">
                  <h3>{t('parentGuide.gettingStarted.settingTone.title')}</h3>
                  <p>{t('parentGuide.gettingStarted.settingTone.text')}</p>
                </div>
              </section>

              <section className="guide-section">
                <h2>{t('parentGuide.choosingScenarios.title')}</h2>
                <div className="scenario-grid">
                  <div className="scenario-card">
                    <div className="scenario-icon">
                      <Image src="/icons/police.svg" alt="Police" width={40} height={40} />
                    </div>
                    <h3>{t('parentGuide.choosingScenarios.police.title')}</h3>
                    <p>{t('parentGuide.choosingScenarios.police.description')}</p>
                  </div>
                  <div className="scenario-card">
                    <div className="scenario-icon">
                      <Image src="/icons/fire.svg" alt="Fire" width={40} height={40} />
                    </div>
                    <h3>{t('parentGuide.choosingScenarios.fire.title')}</h3>
                    <p>{t('parentGuide.choosingScenarios.fire.description')}</p>
                  </div>
                  <div className="scenario-card">
                    <div className="scenario-icon">
                      <Image src="/icons/ambulance.svg" alt="Ambulance" width={40} height={40} />
                    </div>
                    <h3>{t('parentGuide.choosingScenarios.ambulance.title')}</h3>
                    <p>{t('parentGuide.choosingScenarios.ambulance.description')}</p>
                  </div>
                </div>
                <p className="scenario-note">{t('parentGuide.choosingScenarios.note')}</p>
              </section>

              <section className="guide-section">
                <h2>{t('parentGuide.practicePhrases.title')}</h2>
                <p className="section-intro">{t('parentGuide.practicePhrases.intro')}</p>
                <div className="phrases-list">
                  {['phrase1', 'phrase2', 'phrase3', 'phrase4'].map((phrase, index) => (
                    <div key={index} className="phrase-item">
                      "{t(`parentGuide.practicePhrases.${phrase}`)}"
                    </div>
                  ))}
                </div>
                <p className="phrase-note">{t('parentGuide.practicePhrases.note')}</p>
              </section>

              <section className="guide-section">
                <h2>{t('parentGuide.duringCall.title')}</h2>
                <div className="role-grid">
                  <div className="role-card">
                    <h3>{t('parentGuide.duringCall.role.title')}</h3>
                    <ul>
                      {['point1', 'point2', 'point3', 'point4'].map((point, index) => (
                        <li key={index}>{t(`parentGuide.duringCall.role.${point}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="role-card">
                    <h3>{t('parentGuide.duringCall.remember.title')}</h3>
                    <ul>
                      {['point1', 'point2', 'point3'].map((point, index) => (
                        <li key={index}>{t(`parentGuide.duringCall.remember.${point}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="guide-section">
                <h2>{t('parentGuide.buildingConfidence.title')}</h2>
                <div className="confidence-card">
                  <h3>{t('parentGuide.buildingConfidence.afterCall.title')}</h3>
                  <ul>
                    {['question1', 'question2', 'question3'].map((question, index) => (
                      <li key={index}>{t(`parentGuide.buildingConfidence.afterCall.${question}`)}</li>
                    ))}
                  </ul>
                </div>
                <div className="success-signs">
                  <h3>{t('parentGuide.buildingConfidence.successSigns.title')}</h3>
                  <ul>
                    {['sign1', 'sign2', 'sign3'].map((sign, index) => (
                      <li key={index}>{t(`parentGuide.buildingConfidence.successSigns.${sign}`)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="guide-section">
                <h2>{t('parentGuide.frequencyGuide.title')}</h2>
                <div className="frequency-card">
                  <ul>
                    {['firstWeek', 'after', 'beforeTravel'].map((item, index) => (
                      <li key={index}>{t(`parentGuide.frequencyGuide.${item}`)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="guide-section">
                <h2>{t('parentGuide.emergencyNumbers.title')}</h2>
                <div className="numbers-grid">
                  <div className="number-card">
                    <h3>UK</h3>
                    <p>999 or 112</p>
                  </div>
                  <div className="number-card">
                    <h3>EU</h3>
                    <p>112</p>
                  </div>
                </div>
                <p className="coming-soon">{t('parentGuide.emergencyNumbers.comingSoon')}</p>
              </section>

              <div className="guide-cta">
                <Link href="/login" className="ach-button">
                  {t('parentGuide.startPracticeButton')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </PageWrapper>
  );
}
