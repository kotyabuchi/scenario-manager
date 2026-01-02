import { SideMenu } from '@/components/blocks/sidemenu';
import { Grid, GridItem } from '@/styled-system/jsx';

import type { PropsWithChildren } from 'react';

export default function MianLayout({ children }: PropsWithChildren) {
  return (
    <Grid gridTemplateColumns="max-content 1fr" gap="0">
      <GridItem padding="2" height="100dvh">
        <SideMenu />
      </GridItem>
      <GridItem padding="2">{children}</GridItem>
    </Grid>
  );
}
