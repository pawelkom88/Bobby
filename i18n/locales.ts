// TODO: Re-enable Polish locale when translations are complete
// export const locales = ['en', 'pl'] as const;
export const locales = ['en'] as const;
export const defaultLocale = 'en' as const;
export type Locale = (typeof locales)[number];

// Keep locale metadata for future use
export const localeNames: Record<string, string> = {
  en: 'English',
  pl: 'Polski',
};

export const localeFlags: Record<string, string> = {
  en: '🇬🇧',
  pl: '🇵🇱',
};
