import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { OptimizedProviders } from '@/components/OptimizedProviders';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chewy&family=Nunito&display=swap"
          rel="stylesheet"
        />
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
      <body>
        <OptimizedProviders>{children}</OptimizedProviders>
      </body>
    </html>
  );
}
