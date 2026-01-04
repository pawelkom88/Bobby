import { Nunito, Luckiest_Guy } from 'next/font/google';

export const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-nunito',
});

export const luckiestGuy = Luckiest_Guy({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-luckiest-guy',
});
