import { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AuthProvider } from '@/context/AuthContext';
import { CreditsProvider } from '@/context/CreditsContext';
import { UserDataProvider } from '@/context/UserDataContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CreditsProvider>
        <UserDataProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <ProtectedRoute>{children}</ProtectedRoute>
          </Suspense>
        </UserDataProvider>
      </CreditsProvider>
    </AuthProvider>
  );
}
