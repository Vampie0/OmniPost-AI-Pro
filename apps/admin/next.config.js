const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@socialpilot/types', '@socialpilot/tokens'],
  reactStrictMode: true,
  // Monorepo: anchor serverless trace to the workspace root (single React 19 copy everywhere)
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = nextConfig;
