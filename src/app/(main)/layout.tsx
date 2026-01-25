import { FeedbackButton } from '@/components/blocks/FeedbackButton';
import { GlobalHeader } from '@/components/blocks/GlobalHeader';
import { Flex } from '@/styled-system/jsx';

import type { PropsWithChildren } from 'react';

// 淡い緑のグラデーション背景
const mainBg =
  'linear-gradient(135deg, oklch(0.98 0.02 150) 0%, oklch(0.98 0.02 180) 100%)';

export default function MainLayout({ children }: PropsWithChildren) {
  return (
    <Flex direction="column" minHeight="100dvh" background={mainBg}>
      <GlobalHeader />
      <Flex flex="1" direction="column">
        {children}
      </Flex>
      <FeedbackButton />
    </Flex>
  );
}
