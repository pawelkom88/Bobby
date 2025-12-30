import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { logger } from '@/lib/logger';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (only once)
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Flag to track if App Check has been initialized
let appCheckInitialized = false;

// Initialize App Check with reCAPTCHA Enterprise (deferred until needed)
export function initializeAppCheckIfNeeded() {
  if (typeof window === 'undefined' || appCheckInitialized) {
    return;
  }

  const reCaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (reCaptchaSiteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(reCaptchaSiteKey),
        isTokenAutoRefreshEnabled: true, // Automatically refresh tokens
      });
      appCheckInitialized = true;
      logger.log('App Check initialized on demand');
    } catch (error) {
      // App Check might already be initialized in development/testing
      logger.warn('App Check initialization warning:', error);
    }
  } else {
    logger.warn(
      'reCAPTCHA Enterprise site key not found. App Check will not be initialized.'
    );
  }
}

export const db = getFirestore(app);

// Initialize Auth
export const auth: Auth = getAuth(app);

export { app, analytics };
