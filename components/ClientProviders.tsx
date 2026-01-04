'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

// Dynamically import DeepgramContextProvider to avoid SSR issues
const DeepgramContextProvider = dynamic(
  () => import('@/context/DeepgramContextProvider').then(mod => ({
    default: mod.DeepgramContextProvider,
  })),
  {
    ssr: false,
    loading: () => <LoadingSpinner />,
  }
);

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <DeepgramContextProvider>
      {children}
    </DeepgramContextProvider>
  );
}
