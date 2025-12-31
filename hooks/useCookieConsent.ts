import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

interface ConsentData {
  consent: 'accepted' | 'rejected';
  timestamp: string;
}

const STORAGE_KEY = 'cookieConsent';

export function useCookieConsent() {
  const [cookies, setCookie, removeCookie] = useCookies();
  const [consent, setConsent] = useState<ConsentStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: ConsentData = JSON.parse(stored);
        setConsent(data.consent);
      } catch (error) {
        console.error('Failed to parse cookie consent data:', error);
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
  };

  const rejectCookies = () => {
    const consentData: ConsentData = {
      consent: 'rejected',
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
    setConsent('rejected');

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
