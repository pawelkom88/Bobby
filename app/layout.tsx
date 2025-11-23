import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Nunito, Atkinson_Hyperlegible } from 'next/font/google';
import localFont from 'next/font/local';

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-family-body',
  display: 'swap',
});

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-atkinson-hyperlegible',
  display: 'swap',
});

const superKindly = localFont({
  src: '../public/amityjack.ttf',
  variable: '--font-super-kindly',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bobby - Emergency Training for Kids',
  description: 'Help children practice emergency calls in a safe, fun way',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${atkinsonHyperlegible.variable} ${superKindly.variable}`}>
      <body className={nunito.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
