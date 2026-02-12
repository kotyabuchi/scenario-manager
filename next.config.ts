import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    optimizePackageImports: [
      '@phosphor-icons/react',
      '@phosphor-icons/react/ssr',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**/*.png',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
    ],
  },
};

export default nextConfig;
