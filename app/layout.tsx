import type { ReactNode } from 'react';
import './globals.css';
import './auth.css';
import { nunito, luckiestGuy } from '@/lib/fonts';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${nunito.variable} ${luckiestGuy.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
