import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { SystemMessage } from '@/components/blocks/SystemMessage';
import { JotaiProvider } from '@/components/providers/JotaiProvider';

import type { Metadata } from 'next';
import './globals.css';

import { bodyStyle } from './styles';

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
