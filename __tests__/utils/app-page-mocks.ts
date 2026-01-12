import { vi } from 'vitest';
import React from 'react';

export const mockPush = vi.fn();
export const mockClearSessionMutate = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: { src: string; alt: string }) {
    return React.createElement('img', { src: props.src, alt: props.alt });
  },
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock('@/hooks/mutations/useSessionMutations', () => ({
  useClearSession: () => ({
    mutate: mockClearSessionMutate,
    isPending: false,
    isSuccess: false,
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false,
  }),
}));

vi.mock('@/components/PageWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'page-wrapper' }, children),
}));

vi.mock('@/components/SpeculationRules', () => ({
  SpeculationRules: () => null,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));
