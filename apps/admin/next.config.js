/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@socialpilot/types', '@socialpilot/tokens'],
  reactStrictMode: true,
};

module.exports = nextConfig;
