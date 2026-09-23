import '../src/app/globals.css';

import { createElement } from 'react';
import { Noto_Sans_JP } from 'next/font/google';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

import { AgentationCanvas } from './AgentationCanvas';

import type { Preview } from '@storybook/react';

// Storybook は layout.tsx を通らないため、next/font の CSS 変数が注入されない。
// アプリと同じ設定でフォントを読み込み、変数を全ストーリーに当てる。
// （@storybook/nextjs-vite が next/font を変換して実フォントをロードする）
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  preload: false,
});

const preview: Preview = {
  decorators: [
    (Story, context) =>
      createElement(
        'div',
        {
          className: notoSansJP.variable,
          style: { fontFamily: 'var(--font-noto-sans-jp), sans-serif' },
        },
        createElement(Story),
        process.env.NODE_ENV === 'development' &&
          context.viewMode === 'story' &&
          createElement(AgentationCanvas, {
            key: context.id,
            storyId: context.id,
          }),
      ),
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
    },

    viewport: {
      options: {
        ...MINIMAL_VIEWPORTS,
        // パネル幅の検証用プリセット。
        // 高さを控えめ(700px)にしてキャンバスに収め、外側スクロールを防ぐ
        // （端末プリセットは実機サイズ再現が目的のため、画面より背が高いと外側スクロールが出るのは仕様）
        panelNarrow: {
          name: '2ペイン詳細（狭 600px）',
          styles: { width: '600px', height: '700px' },
          type: 'desktop',
        },
        panelWide: {
          name: '2ペイン詳細（広 1100px）',
          styles: { width: '1100px', height: '700px' },
          type: 'desktop',
        },
      },
    },

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#f6f8f7' },
        { name: 'white', value: '#ffffff' },
      ],
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
