import type { AppPathname } from '@/i18n/routing';

/**
 * Central route configuration for the application
 * Use these constants instead of hardcoded strings for navigation
 * Routes are typed to match the localized pathnames in i18n/routing.ts
 */
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
} as const satisfies Record<string, AppPathname>;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
