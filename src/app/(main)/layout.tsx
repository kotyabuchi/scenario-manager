import { FeedbackButton } from '@/components/blocks/FeedbackButton';
import { GlobalHeader } from '@/components/blocks/GlobalHeader';
import { SimpleFooter } from '@/components/blocks/SimpleFooter';
import { Flex } from '@/styled-system/jsx';

import type { PropsWithChildren } from 'react';

export default function MainLayout({ children }: PropsWithChildren) {
  return (
    <Flex direction="column" minHeight="100dvh" bg="bg.page">
      <GlobalHeader />
      <Flex flex="1" direction="column">
        {children}
      </Flex>
      <SimpleFooter />
      <FeedbackButton />
    </Flex>
  );
}
