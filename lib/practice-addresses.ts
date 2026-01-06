import type { AgeTier } from '@/types';
import type { Locale } from '@/lib/prompts';

export interface PracticeAddress {
  id: string;
  line: string;
}

const PRACTICE_ADDRESSES: Record<Locale, Record<AgeTier, PracticeAddress[]>> = {
  en: {
    1: [
      { id: 'en-1-1', line: '5 Sunny Road, Playtown' },
      { id: 'en-1-2', line: '7 Star Lane, Toytown' },
      { id: 'en-1-3', line: '3 Apple Street, Happy Town' },
      { id: 'en-1-4', line: '8 Rainbow Road, Sun Town' },
      { id: 'en-1-5', line: '4 Bluebell Lane, Bunny Town' },
      { id: 'en-1-6', line: '6 Maple Street, Star Town' },
      { id: 'en-1-7', line: '2 Cherry Road, Moon Town' },
      { id: 'en-1-8', line: '9 River Lane, Fun Town' },
      { id: 'en-1-9', line: '1 Oak Road, Bright Town' },
      { id: 'en-1-10', line: '10 Green Road, Cloud Town' },
    ],
    2: [
      { id: 'en-2-1', line: '14 Oak Street, Riverdale' },
      { id: 'en-2-2', line: '22 Pine Road, Lakeview' },
      { id: 'en-2-3', line: '9 Willow Lane, Brightfield' },
      { id: 'en-2-4', line: '18 Maple Street, Hillford' },
      { id: 'en-2-5', line: '27 Cedar Road, Sunnyfield' },
      { id: 'en-2-6', line: '11 Brook Road, Meadowton' },
      { id: 'en-2-7', line: '6 Park Lane, Starbridge' },
      { id: 'en-2-8', line: '30 Garden Street, Foxbury' },
      { id: 'en-2-9', line: '16 Birch Road, Northvale' },
      { id: 'en-2-10', line: '24 River Road, Greenhaven' },
    ],
    3: [
      { id: 'en-3-1', line: 'Flat 2, 18 River Road, Lakeview' },
      { id: 'en-3-2', line: 'Flat 3, 22 Oak Street, Hillford' },
      { id: 'en-3-3', line: 'Unit 5, 14 Maple Lane, Brookton' },
      { id: 'en-3-4', line: '28 Pine Street, Northvale' },
      { id: 'en-3-5', line: '12 Meadow Road, Westbrook' },
      { id: 'en-3-6', line: '7 Cedar Lane, Foxbury' },
      { id: 'en-3-7', line: 'Flat 4, 9 Garden Street, Brightfield' },
      { id: 'en-3-8', line: '31 Park Road, Greenhaven' },
      { id: 'en-3-9', line: '19 Birch Street, Sunnyfield' },
      { id: 'en-3-10', line: 'Flat 1, 6 Willow Lane, Starbridge' },
    ],
  },
  pl: {
    1: [
      { id: 'pl-1-1', line: 'Słoneczna 5, Bajkowo' },
      { id: 'pl-1-2', line: 'Leśna 7, Wesołowo' },
      { id: 'pl-1-3', line: 'Kwiatowa 3, Słoneczno' },
      { id: 'pl-1-4', line: 'Krótka 8, Misiowo' },
      { id: 'pl-1-5', line: 'Polna 4, Bajkowo' },
      { id: 'pl-1-6', line: 'Zielona 6, Wesołowo' },
      { id: 'pl-1-7', line: 'Łąkowa 2, Słoneczno' },
      { id: 'pl-1-8', line: 'Główna 9, Misiowo' },
      { id: 'pl-1-9', line: 'Radosna 1, Krainka' },
      { id: 'pl-1-10', line: 'Spokojna 10, Bajkowo' },
    ],
    2: [
      { id: 'pl-2-1', line: 'Brzozowa 12, Wesołowo' },
      { id: 'pl-2-2', line: 'Lipowa 18, Bajkowo' },
      { id: 'pl-2-3', line: 'Jesionowa 9, Słoneczno' },
      { id: 'pl-2-4', line: 'Akacjowa 21, Misiowo' },
      { id: 'pl-2-5', line: 'Klonowa 16, Krainka' },
      { id: 'pl-2-6', line: 'Parkowa 7, Gwiazdkowo' },
      { id: 'pl-2-7', line: 'Szkolna 14, Bajkowo' },
      { id: 'pl-2-8', line: 'Szeroka 24, Wesołowo' },
      { id: 'pl-2-9', line: 'Ogrodowa 11, Słoneczno' },
      { id: 'pl-2-10', line: 'Mostowa 20, Misiowo' },
    ],
    3: [
      { id: 'pl-3-1', line: 'Kwiatowa 8, Bajkowo' },
      { id: 'pl-3-2', line: 'Leśna 15, Wesołowo' },
      { id: 'pl-3-3', line: 'Polna 30, Słoneczno' },
      { id: 'pl-3-4', line: 'Parkowa 12, Krainka' },
      { id: 'pl-3-5', line: 'Zielona 19, Wesołowo' },
      { id: 'pl-3-6', line: 'Słoneczna 22, Bajkowo' },
      { id: 'pl-3-7', line: 'Lipowa 6, Misiowo' },
      { id: 'pl-3-8', line: 'Brzozowa 10, Gwiazdkowo' },
      { id: 'pl-3-9', line: 'Główna 25, Słoneczno' },
      { id: 'pl-3-10', line: 'Ogrodowa 17, Misiowo' },
    ],
  },
};

const ADDRESS_TRIGGERS: Record<Locale, string[]> = {
  en: ['address'],
  pl: ['adres'],
};

const getList = (ageTier: AgeTier, locale: Locale): PracticeAddress[] => {
  return PRACTICE_ADDRESSES[locale]?.[ageTier] ?? PRACTICE_ADDRESSES.en[ageTier];
};

export function pickPracticeAddress(
  ageTier: AgeTier,
  locale: Locale
): PracticeAddress {
  const list = getList(ageTier, locale);
  const index = Math.floor(Math.random() * list.length);
  return list[index] ?? list[0];
}

export function buildPracticeAddressPrompt(
  ageTier: AgeTier,
  locale: Locale,
  addressLine: string
): string {
  if (locale === 'pl') {
    const lineByAge = {
      1: `To ćwiczenie, więc nie mów prawdziwego adresu. Adres do ćwiczeń na ekranie to: ${addressLine}. Powiedz mi go.`,
      2: `Ponieważ to ćwiczenie, użyj adresu do ćwiczeń na ekranie: ${addressLine}. Powiedz mi go.`,
      3: `To ćwiczenie, więc użyj adresu do ćwiczeń na ekranie: ${addressLine}. Podaj mi ten adres.`,
    } as const;

    return `
### ADRES DO ĆWICZEŃ (WAŻNE)
- To ćwiczenie. Nigdy nie proś o prawdziwy adres.
- Użyj wyłącznie adresu do ćwiczeń: "${addressLine}".
- Gdy pierwszy raz prosisz o adres, powiedz dokładnie: "${lineByAge[ageTier]}".
- Zawsze używaj słowa "adres" w tym pytaniu, żeby dziecko miało jasny sygnał.
- Poproś dziecko, żeby powtórzyło adres i potwierdź go.
`;
  }

  const lineByAge = {
    1: `This is practice, so don't use your real address. The practice address on your screen is: ${addressLine}. Can you say that to me?`,
    2: `Because this is practice, use the practice address on your screen: ${addressLine}. Please say it to me.`,
    3: `This is practice, so use the practice address on your screen: ${addressLine}. Tell me that address.`,
  } as const;

  return `
### PRACTICE ADDRESS (IMPORTANT)
- This is practice. Never ask for or accept a real address.
- Use ONLY the practice address: "${addressLine}".
- When you first ask for the address, say exactly: "${lineByAge[ageTier]}".
- Always include the word "address" in that question so it is clear.
- Ask the child to repeat it and then confirm it back.
`;
}

export function isPracticeAddressPrompt(
  message: string,
  locale: Locale
): boolean {
  const normalized = message.toLowerCase();
  return ADDRESS_TRIGGERS[locale].some(trigger => normalized.includes(trigger));
}
