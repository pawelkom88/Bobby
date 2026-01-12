'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageWrapper from '@/components/PageWrapper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScenarioCarousel } from './landing-page';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import MobileNav from '@/components/MobileNav';
import FaqAccordion from '@/components/FaqAccordion';
import { HowItWorksSection } from '@/app/[locale]/landing-page/HowItWorksSection';
import { BeforeFirstCallSection } from '@/app/[locale]/landing-page/BeforeFirstCallSection';
import { VideoDemoSection } from '@/app/[locale]/landing-page/VideoDemoSection';
import styles from './LandingPage.module.css';

const trustStripItems = [
  {
    id: 1,
    translation: 'hero.trustStrip.practiceOnly',
    altTranslation: 'hero.trustStrip.practiceOnly',
    imageSrc: '/icon1.webp',
    width: 400,
    height: 441,
    iconScale: 1.12,
  },
  {
    id: 2,
    translation: 'hero.trustStrip.realEmergencies',
    altTranslation: 'hero.trustStrip.realEmergencies',
    imageSrc: '/icon2.webp',
    width: 400,
    height: 393,
  },
  {
    id: 3,
    translation: 'hero.trustStrip.noRecordings',
    altTranslation: 'hero.trustStrip.noRecordings',
    imageSrc: '/icon3.webp',
    width: 400,
    height: 305,
  },
  {
    id: 4,
    translation: 'hero.trustStrip.parentSupervision',
    altTranslation: 'hero.trustStrip.parentSupervision',
    imageSrc: '/icon4.webp',
    width: 400,
    height: 350,
  },
  {
    id: 5,
    translation: 'hero.trustStrip.noScaryContent',
    altTranslation: 'hero.trustStrip.noScaryContent',
    imageSrc: '/icon5.webp',
    width: 400,
    height: 338,
  },
];

export default function HomePageClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const locale = useLocale();

  // Redirect authenticated users to /app
  useEffect(() => {
    if (!loading && user) {
      router.push('/app');
    }
  }, [user, loading, router]);

  const t = useTranslations('landing');
  const [showAllFAQs, setShowAllFAQs] = useState(false);

  const faqItems = t.raw('faq.items') as Record<
    string,
    { question: string; answer: string }
  >;

  // todo Paw - should be function with tests
  const faqIds = Object.keys(faqItems)
    .map(id => Number(id))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const initialFaqIds = faqIds.slice(0, 5);

  const toggleAllFAQs = () => {
    setShowAllFAQs(!showAllFAQs);
  };

  return (
    <PageWrapper scrollRestorationKey={`landing:${locale}`}>
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
                  <Link href="/blog">{t('nav.blog')}</Link>
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
                    <ul className={styles.landingTrustStripItems}>
                      {trustStripItems.map(item => (
                        <li
                          key={item.id}
                          className={styles.landingTrustStripItem}
                        >
                          <span
                            className={styles.landingTrustStripIcon}
                            style={
                              {
                                '--icon-scale': item.iconScale ?? 1,
                              } as CSSProperties
                            }
                          >
                            <Image
                              src={item.imageSrc}
                              alt={t(item.altTranslation)}
                              width={item.width}
                              height={item.height}
                              sizes="64px"
                              className={styles.landingTrustStripIconImage}
                              preload
                            />
                          </span>
                          <span className={styles.landingTrustStripText}>
                            {t(item.translation)}
                          </span>
                        </li>
                      ))}
                    </ul>
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
                <FaqAccordion
                  ids={showAllFAQs ? faqIds : initialFaqIds}
                  getQuestion={id => t(`faq.items.${id}.question`)}
                  getAnswer={id => t(`faq.items.${id}.answer`)}
                  resetKey={showAllFAQs}
                />
                <button
                  type="button"
                  className={styles.faqToggleButton}
                  onClick={toggleAllFAQs}
                >
                  {showAllFAQs
                    ? t('faq.toggle.showLess')
                    : t('faq.toggle.showAll', { count: faqIds.length })}
                </button>
              </section>
            </main>

            <footer className={styles.landingFooter}>
              <Link href="/safety-privacy" className={styles.landingFooterLink}>
                {t('footer.links.safetyPrivacy')}
              </Link>
              <Link
                href="/terms-conditions"
                className={styles.landingFooterLink}
              >
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
  );
}
