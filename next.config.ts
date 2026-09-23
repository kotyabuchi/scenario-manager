import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  // E2E の本番ビルドを開発サーバーの生成物から分離する。
  ...(process.env.SCENARIO_E2E_BUILD === '1' ? { distDir: '.next-e2e' } : {}),
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
