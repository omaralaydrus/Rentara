import type { NextConfig } from 'next';
const config: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
  serverExternalPackages: ['node:sqlite'],
  outputFileTracingExcludes: { '/*': ['./data/**/*', './.env*'] },
};
export default config;
