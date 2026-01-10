import nextConfig from 'eslint-config-next';
import reactCompiler from 'eslint-plugin-react-compiler';

const baseConfig =
  Array.isArray(nextConfig) ? nextConfig : nextConfig.default ?? nextConfig;

export default [
  ...baseConfig,
  {
    ignores: ['.mcp/**'],
  },
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'warn',
    },
  },
];
