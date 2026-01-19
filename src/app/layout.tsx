import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { SystemMessage } from '@/components/blocks/SystemMessage';
import { JotaiProvider } from '@/components/providers/JotaiProvider';
import { css } from '@/styled-system/css';

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'シナプレ管理くん',
  description: 'TRPGセッションを、もっと快適に。',
};

const bodyStyle = css({
  minH: '100vh',
  bg: 'linear-gradient(180deg, {colors.bg.subtle}, {colors.bg.base})',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={bodyStyle}>
        <JotaiProvider>
          <NuqsAdapter>
            <SystemMessage />
            {children}
          </NuqsAdapter>
        </JotaiProvider>
      </body>
    </html>
  );
}
