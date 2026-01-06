import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface CookieBannerProps {
  className?: string;
}

const BANNER_DELAY_MS = 3500;

export default function CookieBanner({ className = '' }: CookieBannerProps) {
  const { consent, isLoading, acceptCookies, rejectCookies, hasConsented } = useCookieConsent();
  const t = useTranslations('cookies');
  const bannerRef = useRef<HTMLDivElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isLoading || hasConsented) {
      setShowBanner(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowBanner(true);
    }, BANNER_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [hasConsented, isLoading]);

  // Focus trap within banner
  useEffect(() => {
    if (showBanner && !hasConsented && !isLoading && bannerRef.current) {
      // Focus the accept button when banner appears
      acceptButtonRef.current?.focus();
      
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const focusableElements = bannerRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<HTMLElement>;
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
        
        // Close on Escape
        if (e.key === 'Escape') {
          rejectCookies();
        }
      };

      document.addEventListener('keydown', handleTabKey);
      
      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [hasConsented, isLoading, rejectCookies, showBanner]);

  // Don't render anything while loading or if consent has been given
  if (isLoading || hasConsented || !showBanner) {
    return null;
  }

  return (
    <div
      ref={bannerRef}
      className={`cookie-banner ${hasConsented ? 'cookie-banner-hidden' : ''} ${className}`}
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      aria-modal="true"
    >
      <div className="cookie-banner-content">
        <div className="cookie-banner-layout">
          <div className="cookie-banner-text">
            <h2
              id="cookie-banner-title"
              className="cookie-banner-title"
            >
              {t('title')}
            </h2>
            <p
              id="cookie-banner-description"
              className="cookie-banner-description"
            >
              {t('description')}
            </p>
          </div>
          
          <div className="cookie-banner-buttons">
            <button
              ref={rejectButtonRef}
              onClick={rejectCookies}
              className="cookie-banner-button cookie-banner-button-reject"
              aria-label={t('rejectAll')}
            >
              {t('rejectAll')}
            </button>
            <button
              ref={acceptButtonRef}
              onClick={acceptCookies}
              className="cookie-banner-button cookie-banner-button-accept"
              aria-label={t('acceptAll')}
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
