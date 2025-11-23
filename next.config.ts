import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
