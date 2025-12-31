'use client';

import Script from 'next/script';
import { useEffect } from 'react';

// This component handles Google's Consent Mode v2
// It must be rendered early in the app to set default consent
export function AnalyticsConsent() {
  // Don't load anything in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  
  // Don't load if measurement ID is missing
  if (!measurementId) {
    console.warn('%c⚠️ Firebase Measurement ID is missing', 'color: #ea4335; font-weight: bold;');
    return null;
  }

  useEffect(() => {
    // Set default consent state (required for GDPR)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'wait_for_update': 500 // Wait 500ms for consent update
      });
    }
  }, []);

  return (
    <Script
      strategy="beforeInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      onLoad={() => {
        // Initialize data layer
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        
        // Set default consent
        window.gtag('consent', 'default', {
          'analytics_storage': 'denied',
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied',
          'wait_for_update': 500
        });
        
        // Initialize config
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
          send_page_view: false // We'll handle page views manually
        });
      }}
    />
  );
}

// Extend Window interface
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}
