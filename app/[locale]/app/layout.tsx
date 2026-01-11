import { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AuthProvider } from '@/context/AuthContext';
import { CreditsProvider } from '@/context/CreditsContext';
import { UserDataProvider } from '@/context/UserDataContext';
import ClientProviders from '@/components/ClientProviders';
import { ViewTransition } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CreditsProvider>
        <UserDataProvider>
          <ClientProviders>
            <ViewTransition>
              <Suspense fallback={<LoadingSpinner />}>
                <ProtectedRoute>{children}</ProtectedRoute>
              </Suspense>
            </ViewTransition>
          </ClientProviders>
        </UserDataProvider>
      </CreditsProvider>
    </AuthProvider>
  );
}
