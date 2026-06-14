/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@prisma/client',
      'prisma',
      // Keep the headless-browser stack out of the webpack bundle.
      'playwright',
      'playwright-core',
      '@sparticuz/chromium',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.dbs.com' },
      { protocol: 'https', hostname: '**.ocbc.com' },
      { protocol: 'https', hostname: '**.uob.com' },
    ],
  },
};

module.exports = nextConfig;
