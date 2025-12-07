import { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading ..." />}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </Suspense>
  );
}
