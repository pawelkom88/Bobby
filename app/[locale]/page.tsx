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
          <div className="landing-container">
            <div className="landing-wrapper">
              <nav className="landing-nav">
                <Link href="/login" className="ach-button-small">
                  {t('nav.startTraining')}
                </Link>
                <ul className="nav-ul">
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

              <main className="landing-main">
                <div className="landing-content">
                  <div className="landing-text-section">
                    <h1 className="landing-title">{t('hero.title')}</h1>
                    <p className="landing-subtitle">{t('hero.subtitle')}</p>
                    <div
                      className="landing-trust-strip"
                      role="note"
                      aria-label={t('hero.trustStrip.ariaLabel')}
                    >
                      <div className="landing-trust-strip-title">
                        {t('hero.trustStrip.title')}
                      </div>
                      <div className="landing-trust-strip-items" role="list">
                        {trustStripItems.map(item => (
                          <div
                            key={item.id}
                            className="landing-trust-strip-item"
                            role="listitem"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <Image
                              src={item.imageSrc}
                              alt={item.translation}
                              width={48}
                              height={48}
                              className="landing-trust-strip-icon"
                              aria-hidden="true"
                              fetchPriority="high"
                              preload
                            />
                            <span className="landing-trust-strip-text">
                              {t(item.translation)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Link
                      href="/login"
                      className="ach-button ach-button-landing"
                    >
                      {t('hero.cta')}
                    </Link>
                    <a
                      href="#how-it-works"
                      className="landing-secondary-cta-button"
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
                  />
                </div>
                <HowItWorksSection />
                <BeforeFirstCallSection />
                <VideoDemoSection />
                <ScenarioCarousel />
                <section id="faq" className="landing-faq-section">
                  <h2 className="landing-faq-title">{t('faq.title')}</h2>
                  <div className="faq-accordion" role="list">
                    {(showAllFAQs ? ALL_FAQ_IDS : INITIAL_FAQ_IDS).map(id => (
                      <div
                        key={id}
                        className={`faq-accordion-item ${expandedId === id ? 'expanded' : ''}`}
                        role="listitem"
                      >
                        <button
                          type="button"
                          className="faq-accordion-trigger"
                          onClick={() => toggleQuestion(id)}
                          aria-expanded={expandedId === id}
                          aria-controls={`faq-answer-${id}`}
                        >
                          <span className="faq-accordion-question">
                            {t(`faq.items.${id}.question`)}
                          </span>
                          <span
                            className="faq-accordion-icon"
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
                          className="faq-accordion-content"
                          role="region"
                          aria-labelledby={`faq-question-${id}`}
                          hidden={expandedId !== id}
                        >
                          <p>{t(`faq.items.${id}.answer`)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="faq-toggle-button"
                    onClick={toggleAllFAQs}
                  >
                    {showAllFAQs
                      ? t('faq.toggle.showLess')
                      : t('faq.toggle.showAll', { count: ALL_FAQ_IDS.length })}
                  </button>
                </section>
              </main>

              <footer className="landing-footer">
                <Link href="/safety-privacy" className="landing-footer-link">
                  {t('footer.links.safetyPrivacy')}
                </Link>
                <Link href="/terms-conditions" className="landing-footer-link">
                  {t('footer.links.termsConditions')}
                </Link>
                <Link href="/contact" className="landing-footer-link">
                  {t('footer.links.contact')}
                </Link>
                <Link href="/cookies-policy" className="landing-footer-link">
                  {t('footer.links.cookiesPolicy')}
                </Link>
                <Link href="/privacy-policy" className="landing-footer-link">
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
