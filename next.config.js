/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
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
