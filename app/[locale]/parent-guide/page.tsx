'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Image from 'next/image';
import styles from './ParentGuidePage.module.css';

export default function ParentGuidePage() {
  const t = useTranslations('landing');

  return (
    <PageWrapper>
      <ErrorBoundary>
        <div className={styles.parentGuideContainer}>
          <div className={styles.parentGuideWrapper}>
            <div className={styles.parentGuideHeader}>
              <h1 className={styles.parentGuideTitle}>{t('parentGuide.title')}</h1>
              <p className={styles.parentGuideSubtitle}>{t('parentGuide.subtitle')}</p>
            </div>

            <div className={styles.parentGuideContent}>
              <section className={styles.guideSection}>
                <h2>{t('parentGuide.gettingStarted.title')}</h2>
                <div className={styles.guideCard}>
                  <h3>{t('parentGuide.gettingStarted.settingTone.title')}</h3>
                  <p>{t('parentGuide.gettingStarted.settingTone.text')}</p>
                </div>
              </section>

              <section className={styles.guideSection}>
                <h2>{t('parentGuide.practicePhrases.title')}</h2>
                <p className={styles.sectionIntro}>{t('parentGuide.practicePhrases.intro')}</p>
                <div className={styles.phrasesList}>
                  {['phrase1', 'phrase2', 'phrase3', 'phrase4'].map((phrase, index) => (
                    <div key={index} className={styles.phraseItem}>
                      "{t(`parentGuide.practicePhrases.${phrase}`)}"
                    </div>
                  ))}
                </div>
                <p className={styles.phraseNote}>{t('parentGuide.practicePhrases.note')}</p>
              </section>

              <section className={styles.guideSection}>
                <h2>{t('parentGuide.duringCall.title')}</h2>
                <div className={styles.roleGrid}>
                  <div className={styles.roleCard}>
                    <h3>{t('parentGuide.duringCall.role.title')}</h3>
                    <ul>
                      {['point1', 'point2', 'point3', 'point4'].map((point, index) => (
                        <li key={index}>{t(`parentGuide.duringCall.role.${point}`)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.roleCard}>
                    <h3>{t('parentGuide.duringCall.remember.title')}</h3>
                    <ul>
                      {['point1', 'point2', 'point3'].map((point, index) => (
                        <li key={index}>{t(`parentGuide.duringCall.remember.${point}`)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className={styles.guideSection}>
                <h2>{t('parentGuide.buildingConfidence.title')}</h2>
                <div className={styles.confidenceCard}>
                  <h3>{t('parentGuide.buildingConfidence.afterCall.title')}</h3>
                  <ul>
                    {['question1', 'question2', 'question3'].map((question, index) => (
                      <li key={index}>{t(`parentGuide.buildingConfidence.afterCall.${question}`)}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.successSigns}>
                  <h3>{t('parentGuide.buildingConfidence.successSigns.title')}</h3>
                  <ul>
                    {['sign1', 'sign2', 'sign3'].map((sign, index) => (
                      <li key={index}>{t(`parentGuide.buildingConfidence.successSigns.${sign}`)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className={styles.guideSection}>
                <h2>{t('parentGuide.frequencyGuide.title')}</h2>
                <div className={styles.frequencyCard}>
                  <ul>
                    {['firstWeek', 'after', 'beforeTravel'].map((item, index) => (
                      <li key={index}>{t(`parentGuide.frequencyGuide.${item}`)}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className={styles.guideSection}>
                <h2>{t('parentGuide.emergencyNumbers.title')}</h2>
                <div className={styles.numbersGrid}>
                  <div className={styles.numberCard}>
                    <h3>UK</h3>
                    <p>999 or 112</p>
                  </div>
                  <div className={styles.numberCard}>
                    <h3>EU</h3>
                    <p>112</p>
                  </div>
                </div>
                <p className={styles.comingSoon}>{t('parentGuide.emergencyNumbers.comingSoon')}</p>
              </section>

              <div className={styles.guideCta}>
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
