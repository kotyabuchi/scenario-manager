import { isNil } from 'ramda';

import type { NextConfig } from 'next';

const isolatedRunId = process.env.SCENARIO_E2E_RUN_ID;
if (!isNil(isolatedRunId) && !/^[a-f0-9]{12}$/.test(isolatedRunId)) {
  throw new Error('SCENARIO_E2E_RUN_IDが不正です。');
}
const isE2eBuild = process.env.SCENARIO_E2E_BUILD === '1';

const nextConfig: NextConfig = {
  typedRoutes: true,
  // E2E の本番ビルドを開発サーバーの生成物から分離する。
  ...(isE2eBuild
    ? {
        distDir: isNil(isolatedRunId)
          ? '.next-e2e'
          : `.next-e2e/run-${isolatedRunId}`,
      }
    : {}),
  ...(isE2eBuild && !isNil(isolatedRunId)
    ? {
        typescript: {
          tsconfigPath: `test-results/environments/run-${isolatedRunId}/app/tsconfig.json`,
        },
      }
    : {}),
  headers: async () => {
    if (!isE2eBuild || isNil(isolatedRunId)) return [];
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-scenario-e2e-run-id',
            value: isolatedRunId,
          },
        ],
      },
    ];
  },
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
