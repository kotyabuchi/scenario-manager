import { config } from 'dotenv';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Load .env file
config();

export default defineConfig({
  plugins: [tsconfigPaths()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    // Vitest 3では workspace は非推奨、projects を使用
    projects: [
      // ユニットテスト用（ロジック、ユーティリティ）
      {
        extends: true,
        test: {
          name: 'unit',
          include: [
            'src/**/__tests__/**/*.test.ts',
            'src/**/__tests__/**/*.test.tsx',
          ],
          exclude: [
            'node_modules',
            '.next',
            'e2e',
            // DOM APIが必要なテストは除外（後続のプロジェクトで処理）
            'src/components/blocks/SpeedDialFAB/__tests__/*.test.ts',
          ],
          environment: 'node',
        },
      },
      // SpeedDialFAB のユニットテスト用（DOM APIが必要）
      {
        extends: true,
        test: {
          name: 'unit-dom',
          include: ['src/components/blocks/SpeedDialFAB/__tests__/*.test.ts'],
          environment: 'jsdom',
        },
      },
      // コンポーネントテスト用（composeStoriesを使用）
      {
        extends: true,
        test: {
          name: 'component',
          include: ['src/**/*.test.tsx'],
          exclude: [
            'node_modules',
            '.next',
            'e2e',
            'src/**/__tests__/**', // unit testsは除外
          ],
          environment: 'jsdom',
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
