import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    exclude: ['node_modules/**', '.mcp/**', '.netlify/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts', 'components/**/*.tsx'],
      exclude: ['node_modules/', '__tests__/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      // Mock server-only module for tests (Next.js server-only boundary)
      'server-only': path.resolve(__dirname, '__tests__/mocks/server-only.ts'),
    },
  },
});
