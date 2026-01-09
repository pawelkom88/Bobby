import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock server-only module (used by Next.js to prevent client-side imports)
vi.mock('server-only', () => ({}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => ({ ...props }), // Return object instead of JSX
}));

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: () => Promise<any>) => fn,
}));

// Global test setup
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
