import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { analyticsService } from '@/lib/analytics';
import { logger } from '@/lib/logger';

export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

interface ConsentData {
  consent: 'accepted' | 'rejected';
  timestamp: string;
}

const STORAGE_KEY = 'cookieConsent';

export function useCookieConsent() {
  const [cookies, removeCookie] = useCookies();
  const [consent, setConsent] = useState<ConsentStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from localStorage on mount and initialize analytics
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: ConsentData = JSON.parse(stored);
        setConsent(data.consent);
        
        // Initialize analytics with stored consent
        void analyticsService.initialize(data.consent === 'accepted').catch((error) => {
          logger.error('Failed to initialize analytics with stored consent', error);
        });
      } catch (error) {
        logger.error('Failed to parse cookie consent data:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const acceptCookies = () => {
    const consentData: ConsentData = {
      consent: 'accepted',
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    setConsent('accepted');
    
    // Initialize analytics with consent
    void analyticsService.initialize(true).catch((error) => {
      logger.error('Failed to initialize analytics after consent', error);
    });
  };

  const rejectCookies = () => {
    const consentData: ConsentData = {
      consent: 'rejected',
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    setConsent('rejected');
    
    // Disable analytics
    void analyticsService.initialize(false).catch((error) => {
      logger.error('Failed to disable analytics after rejection', error);
    });

    Object.keys(cookies).forEach(cookieName => {
      removeCookie(cookieName, { path: '/' });
    });
  };

  const clearConsent = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConsent('pending');
  };

  return {
    consent,
    isLoading,
    acceptCookies,
    rejectCookies,
    clearConsent,
    hasConsented: consent !== 'pending',
    cookiesAccepted: consent === 'accepted',
  };
}
