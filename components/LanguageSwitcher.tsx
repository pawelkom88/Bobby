'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/locales';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const LOCALE_STORAGE_KEY = 'preferred-locale';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Save to localStorage
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);

    // Set cookie for middleware
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Navigate to new locale
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="language-switcher-label">
        Language / Język
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={e => switchLocale(e.target.value as Locale)}
        className="language-switcher-select"
        aria-label="Select language"
      >
        {locales.map(loc => (
          <option key={loc} value={loc}>
            {localeFlags[loc]} {localeNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LanguageSwitcherCompact() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  const nextLocale = locale === 'en' ? 'pl' : 'en';

  return (
    <button
      onClick={() => switchLocale(nextLocale)}
      className="language-switcher-button"
      aria-label={`Switch to ${localeNames[nextLocale]}`}
      title={`Switch to ${localeNames[nextLocale]}`}
    >
      {localeFlags[nextLocale]} {localeNames[nextLocale]}
    </button>
  );
}
