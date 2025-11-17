import type { Metadata } from 'next';
import './globals.css';
import { SoundProvider } from '@/components/SoundProvider';
import SoundToggleButton from '@/components/SoundToggleButton';

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
    <html lang="en">
      <body>
        <SoundProvider>
          <SoundToggleButton />
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}

