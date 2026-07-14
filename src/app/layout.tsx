import { Noto_Sans_JP } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { DevTools } from './_components/DevTools';

import { SystemMessage } from '@/components/blocks/SystemMessage';
import { JotaiProvider } from '@/components/providers/JotaiProvider';

import type { Metadata } from 'next';
import './globals.css';

import { bodyStyle } from './styles';

// 日本語UI向けフォント。CJKはサブセット削減が効かないため preload:false で
// 「使用時に取得」させ、巨大ファイルの全ページ先読みを避ける。
// variable で吐いた CSS 変数を <html> に当て、PandaCSS の fonts トークンから参照する。
const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  preload: false,
});

export const metadata: Metadata = {
  title: 'シナプレ管理くん',
  description: 'TRPGセッションを、もっと快適に。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className={bodyStyle}>
        <JotaiProvider>
          <NuqsAdapter>
            <SystemMessage />
            {children}
          </NuqsAdapter>
        </JotaiProvider>
        <DevTools />
      </body>
    </html>
  );
}
