import { SideMenu } from '@/components/blocks/sidemenu';
import { Grid, GridItem } from '@/styled-system/jsx';

import type { PropsWithChildren } from 'react';

// 実験用：淡い緑のグラデーション背景
const mainBg =
  'linear-gradient(135deg, oklch(0.98 0.02 150) 0%, oklch(0.98 0.02 180) 100%)';

export default function MianLayout({ children }: PropsWithChildren) {
  return (
    <Grid gridTemplateColumns="max-content 1fr" gap="0" background={mainBg}>
      <GridItem padding="2" height="100dvh">
        <SideMenu />
      </GridItem>
      <GridItem padding="2" minHeight="100dvh">
        {children}
      </GridItem>
    </Grid>
  );
}
