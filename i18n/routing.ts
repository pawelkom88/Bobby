import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale, type Locale } from './locales';

/**
 * Localized pathnames for SEO
 * Maps internal routes to locale-specific URLs
 */
export const pathnames = {
  '/': '/',
  '/contact': {
    en: '/contact',
    pl: '/kontakt',
  },
  '/faq': {
    en: '/faq',
    pl: '/pytania',
  },
  '/login': {
    en: '/login',
    pl: '/logowanie',
  },
  '/signup': {
    en: '/signup',
    pl: '/rejestracja',
  },
  '/forgot-password': {
    en: '/forgot-password',
    pl: '/zapomniane-haslo',
  },
  '/reset-password': {
    en: '/reset-password',
    pl: '/resetuj-haslo',
  },
  '/app': {
    en: '/app',
    pl: '/aplikacja',
  },
  '/app/achievements': {
    en: '/app/achievements',
    pl: '/aplikacja/osiagniecia',
  },
  '/app/chats': {
    en: '/app/chats',
    pl: '/aplikacja/rozmowy',
  },
  '/app/chats/[conversationId]': {
    en: '/app/chats/[conversationId]',
    pl: '/aplikacja/rozmowy/[conversationId]',
  },
  '/app/choose-emergency': {
    en: '/app/choose-emergency',
    pl: '/aplikacja/wybierz-sytuacje',
  },
  '/app/completion': {
    en: '/app/completion',
    pl: '/aplikacja/podsumowanie',
  },
  '/app/conversation': {
    en: '/app/conversation',
    pl: '/aplikacja/rozmowa',
  },
  '/app/dial': {
    en: '/app/dial',
    pl: '/aplikacja/wybierz-numer',
  },
  '/app/preview': {
    en: '/app/preview',
    pl: '/aplikacja/podglad',
  },
  '/app/wybierz-numer': {
    en: '/app/select-package',
    pl: '/aplikacja/wybierz-pakiet',
  },
  '/app/settings': {
    en: '/app/settings',
    pl: '/aplikacja/ustawienia',
  },
  '/app/success': {
    en: '/app/success',
    pl: '/aplikacja/sukces',
  },
  '/app/your-age': {
    en: '/app/your-age',
    pl: '/aplikacja/twoj-wiek',
  },
  '/privacy-policy': {
    en: '/privacy-policy',
    pl: '/polityka-prywatnosci',
  },
  '/cookies-policy': {
    en: '/cookies-policy',
    pl: '/polityka-ciasteczek',
  },
  '/terms-conditions': {
    en: '/terms-conditions',
    pl: 'regulamin',
  },
  '/safety-privacy': {
    en: '/safety-privacy',
    pl: 'bezpieczenstwo-i-prywatnosc',
  },
} as const satisfies Record<string, string | Record<Locale, string>>;

export type AppPathname = keyof typeof pathnames;

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  pathnames,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
