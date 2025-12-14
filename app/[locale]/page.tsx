'use client';

import { ViewTransition } from 'react';
import { useTranslations } from 'next-intl';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScenarioCarousel } from './landing-page';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('landing');

  return (
    <ViewTransition>
      <PageWrapper>
        <ErrorBoundary>
          <div className="landing-container">
            <div className="landing-wrapper">
              <nav className="landing-nav">
                <ul className="nav-ul">
                  <li>
                    <Link href=""></Link>
                  </li>
                  <li>
                    <Link href=""></Link>
                  </li>
                  <li>
                    <Link href="#how-it-works">{t('nav.howItWorks')}</Link>
                  </li>
                </ul>
                <Link href="/login" className="ach-button-small">
                  {t('nav.startTraining')}
                </Link>
              </nav>

              <main className="landing-main">
                <div className="landing-content">
                  <div className="landing-text-section">
                    <h1 className="landing-title">
                      {t('hero.title')}
                    </h1>
                    <p className="landing-subtitle">
                      {t('hero.subtitle')}
                    </p>
                    <Link
                      href="/login"
                      className="ach-button ach-button-landing"
                    >
                      {t('hero.cta')}
                    </Link>
                    <Link
                      href="/#how-it-works"
                      className="landing-secondary-cta-button"
                    >
                      {t('hero.secondaryCta')}
                    </Link>
                  </div>
                  <Image
                    preload
                    width={350}
                    height={275}
                    src="/bobby.png"
                    alt="Hero Image - smiling Bobby"
                  />
                </div>
              </main>

              <ScenarioCarousel />

              <footer className="landing-footer">
                <span className="landing-footer-text">
                  {t('footer.ready')}
                </span>
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
