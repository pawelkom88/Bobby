import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { app } from './firebase';

let appCheckInitialized = false;

export function initializeAppCheckLazy() {
  if (appCheckInitialized || typeof window === 'undefined') {
    return;
  }

  const reCaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (reCaptchaSiteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(reCaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckInitialized = true;
    } catch (error) {
      console.warn('App Check initialization warning:', error);
    }
  } else {
    console.warn(
      'reCAPTCHA Enterprise site key not found. App Check will not be initialized.'
    );
  }
}
