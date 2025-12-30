import type { AppPathname } from '@/i18n/routing';

export const ROUTES = {
  HOME: '/',
  APP: '/app',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  YOUR_AGE: '/app/your-age',
  CHOOSE_EMERGENCY: '/app/choose-emergency',
  SELECT_PACKAGE: '/app/wybierz-numer',
  DIAL: '/app/dial',
  CONVERSATION: '/app/conversation',
  COMPLETION: '/app/completion',
  SUCCESS: '/app/success',
  ACHIEVEMENTS: '/app/achievements',
  SETTINGS: '/app/settings',
  CHATS: '/app/chats',
  CONTACT: '/contact',
  FAQ: '/faq',
  PRIVACY_POLICY: '/privacy-policy',
  COOKIES_POLICY: '/cookies-policy',
  TERMS_CONDITIONS: '/terms-conditions',
  SAFETY_PRIVACY: '/safety-privacy',
} as const satisfies Record<string, AppPathname>;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
