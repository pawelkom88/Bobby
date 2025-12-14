import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 * 
 * Features:
 * - throwOnError: true for Error Boundary integration
 * - 5 minute stale time for data freshness
 * - 10 minute garbage collection time
 * - Retry once for failed requests
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      throwOnError: true, // Required for Error Boundaries
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
    },
    mutations: {
      throwOnError: true,
    },
  },
});

/**
 * Helper to create a query key factory
 * Follows the pattern: ['domain', 'entity', 'id', ...params]
 */
export function createQueryKeyFactory(domain: string) {
  return {
    all: [domain] as const,
    lists: () => [domain, 'list'] as const,
    list: (params: Record<string, any>) => [domain, 'list', params] as const,
    details: () => [domain, 'detail'] as const,
    detail: (id: string) => [domain, 'detail', id] as const,
    data: () => [domain, 'data'] as const,
  };
}
