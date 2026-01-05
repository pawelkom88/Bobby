import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
