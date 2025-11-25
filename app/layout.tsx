import type { Metadata } from 'next';
import Script from 'next/script';
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com'),
  title: 'Bobby - Emergency Training for Kids',
  description: 'Help children practice emergency calls in a safe, fun way',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com',
  },
  openGraph: {
    title: 'Bobby - Emergency Training for Kids',
    description: 'Help children practice emergency calls in a safe, fun way',
    images: [
      {
        url: '/bobby-OG-image.png',
        width: 1200,
        height: 630,
        alt: 'Bobby - Emergency Training for Kids',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bobby - Emergency Training for Kids',
    description: 'Help children practice emergency calls in a safe, fun way',
    images: ['/bobby-OG-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${atkinsonHyperlegible.variable} ${superKindly.variable}`}
    >
      <head>
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Bobby - Emergency Training for Kids',
              description:
                'Help children practice emergency calls in a safe, fun way',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web Browser',
              url: process.env.NEXT_PUBLIC_BASE_URL || 'https://bobby-app.com',
              author: {
                '@type': 'Organization',
                name: 'Bobby App Team',
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'GBP',
              },
            }),
          }}
        />
      </head>
      <body className={nunito.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
