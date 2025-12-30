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

const ALL_FAQ_IDS = Array.from({ length: 20 }, (_, i) => i + 1);
const INITIAL_FAQ_IDS = [1, 2, 3, 4, 5];

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
                    // src="/bobby.png"
                    alt="Hero Image - smiling Bobby"
                  />
                </div>
                <HowItWorksSection />
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
                      ? 'Show Less'
                      : `Show All ${ALL_FAQ_IDS.length} Questions`}
                  </button>
                </section>
              </main>

              <footer className="landing-footer">
                <span className="landing-footer-text">{t('footer.ready')}</span>
                <div className="landing-footer-right">
                  <a href="#" className="landing-footer-link">
                    {t('footer.privacy')}
                  </a>
                </div>
              </footer>
            </div>
          </div>
        </ErrorBoundary>
      </PageWrapper>
    </ViewTransition>
  );
}
