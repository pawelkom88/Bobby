import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Webpack configuration for better chunk splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Create separate chunks for vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                return `npm.${packageName.replace('@', '')}`;
              },
              priority: 10,
              reuseExistingChunk: true,
            },
            // Firebase gets its own chunk due to size
            firebase: {
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              name: 'firebase-chunk',
              priority: 20,
              enforce: true,
            },
            // Stripe gets its own chunk
            stripe: {
              test: /[\\/]node_modules[\\/]@stripe[\\/]/,
              name: 'stripe-chunk',
              priority: 20,
              enforce: true,
            },
            // Deepgram gets its own chunk
            deepgram: {
              test: /[\\/]node_modules[\\/]@deepgram[\\/]/,
              name: 'deepgram-chunk',
              priority: 20,
              enforce: true,
            },
            // Common utilities
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    // Reduce bundle size by excluding unnecessary modules
    config.resolve.alias = {
      ...config.resolve.alias,
      // Exclude server-only modules from client bundle
      '@mailersend/node': false,
    };
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
