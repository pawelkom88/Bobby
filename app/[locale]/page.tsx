'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScenarioCarousel } from './landing-page';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import MobileNav from '@/components/MobileNav';
import { HowItWorksSection } from '@/app/[locale]/landing-page/HowItWorksSection';
import { BeforeFirstCallSection } from '@/app/[locale]/landing-page/BeforeFirstCallSection';
import { VideoDemoSection } from '@/app/[locale]/landing-page/VideoDemoSection';
import styles from './LandingPage.module.css';

const ALL_FAQ_IDS = Array.from({ length: 20 }, (_, i) => i + 1);
const INITIAL_FAQ_IDS = [1, 2, 3, 4, 5];

const trustStripItems = Array.from({ length: 5 }, (_, i) => i + 1).map(id => ({
  id,
  translation: `hero.trustStrip.${['practiceOnly', 'realEmergencies', 'noRecordings', 'parentSupervision', 'noScaryContent'][id - 1]}`,
  imageSrc: `/icon${id}.webp`,
}));

export default function HomePage() {
  const t = useTranslations('landing');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAllFAQs, setShowAllFAQs] = useState(false);

  const toggleQuestion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleAllFAQs = () => {
    setShowAllFAQs(!showAllFAQs);
    setExpandedId(null); // Close any expanded question when toggling
  };

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <div className={styles.landingContainer}>
            <div className={styles.landingWrapper}>
              <nav className={styles.landingNav}>
                <Link
                  href="/login"
                  className={`ach-button ach-button-small ${styles.navCta}`}
                >
                  {t('nav.startTraining')}
                </Link>
                <ul className={styles.navUl}>
                  <li>
                    <a href="#how-it-works">{t('nav.howItWorks')}</a>
                  </li>
                  <li>
                    <a href="#faq">{t('nav.faq')}</a>
                  </li>
                  <li>
                    <Link href="/contact">{t('nav.contact')}</Link>
                  </li>
                </ul>
                <MobileNav />
              </nav>

              <main className={styles.landingMain}>
                <div className={styles.landingContent}>
                  <div className={styles.landingTextSection}>
                    <h1 className={styles.landingTitle}>{t('hero.title')}</h1>
                    <p className={styles.landingSubtitle}>{t('hero.subtitle')}</p>
                    <div
                      className={styles.landingTrustStrip}
                      role="note"
                      aria-label={t('hero.trustStrip.ariaLabel')}
                    >
                      <div className={styles.landingTrustStripTitle}>
                        {t('hero.trustStrip.title')}
                      </div>
                      <div
                        className={styles.landingTrustStripItems}
                        role="list"
                      >
                        {trustStripItems.map(item => (
                          <div
                            key={item.id}
                            className={styles.landingTrustStripItem}
                            role="listitem"
                          >
                            <Image
                              src={item.imageSrc}
                              alt={item.translation}
                              width={48}
                              height={48}
                              className={styles.landingTrustStripIcon}
                              aria-hidden="true"
                              fetchPriority="high"
                              preload
                            />
                            <span className={styles.landingTrustStripText}>
                              {t(item.translation)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link
                      href="/login"
                      className={`ach-button ${styles.achButtonLanding}`}
                    >
                      {t('hero.cta')}
                    </Link>
                    <a
                      href="#how-it-works"
                      className={styles.landingSecondaryCtaButton}
                    >
                      {t('hero.secondaryCta')}
                    </a>
                  </div>
                  <Image
                    width={500}
                    height={400}
                    src="/hero-image.webp"
                    alt="Hero Image - smiling Bobby"
                    sizes="(max-width: 768px) 100vw, 392px"
                    preload
                    fetchPriority="high"
                    className={styles.heroImage}
                  />
                </div>
                <HowItWorksSection />
                <BeforeFirstCallSection />
                <VideoDemoSection />
                <ScenarioCarousel />
                <section id="faq" className={styles.landingFaqSection}>
                  <h2 className={styles.landingFaqTitle}>{t('faq.title')}</h2>
                  <div className={styles.faqAccordion} role="list">
                    {(showAllFAQs ? ALL_FAQ_IDS : INITIAL_FAQ_IDS).map(id => {
                      const isExpanded = expandedId === id;
                      const itemClassName = `${styles.faqAccordionItem} ${
                        isExpanded ? styles.faqAccordionItemExpanded : ''
                      }`.trim();

                      return (
                        <div
                          key={id}
                          className={itemClassName}
                          role="listitem"
                        >
                          <button
                            type="button"
                            className={styles.faqAccordionTrigger}
                            onClick={() => toggleQuestion(id)}
                            aria-expanded={isExpanded}
                            aria-controls={`faq-answer-${id}`}
                          >
                            <span className={styles.faqAccordionQuestion}>
                              {t(`faq.items.${id}.question`)}
                            </span>
                            <span
                              className={styles.faqAccordionIcon}
                              aria-hidden="true"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="black"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m9 6 6 6-6 6" />
                              </svg>
                            </span>
                          </button>
                          <div
                            id={`faq-answer-${id}`}
                            className={styles.faqAccordionContent}
                            role="region"
                            aria-labelledby={`faq-question-${id}`}
                            hidden={!isExpanded}
                          >
                            <p>{t(`faq.items.${id}.answer`)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className={styles.faqToggleButton}
                    onClick={toggleAllFAQs}
                  >
                    {showAllFAQs
                      ? t('faq.toggle.showLess')
                      : t('faq.toggle.showAll', { count: ALL_FAQ_IDS.length })}
                  </button>
                </section>
              </main>

              <footer className={styles.landingFooter}>
                <Link href="/safety-privacy" className={styles.landingFooterLink}>
                  {t('footer.links.safetyPrivacy')}
                </Link>
                <Link href="/terms-conditions" className={styles.landingFooterLink}>
                  {t('footer.links.termsConditions')}
                </Link>
                <Link href="/contact" className={styles.landingFooterLink}>
                  {t('footer.links.contact')}
                </Link>
                <Link href="/cookies-policy" className={styles.landingFooterLink}>
                  {t('footer.links.cookiesPolicy')}
                </Link>
                <Link href="/privacy-policy" className={styles.landingFooterLink}>
                  {t('footer.links.privacyPolicy')}
                </Link>
              </footer>
            </div>
          </div>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}
