import { SideMenu } from '@/components/blocks/sidemenu';
import { Grid, GridItem } from '@/styled-system/jsx';

export default function Home() {
  return (
    <Grid gridTemplateColumns="max-content 1fr" gap="0">
      <GridItem padding="2" height="100dvh">
        <SideMenu />
      </GridItem>
      <main>
        <h1>シナプレ管理くんα</h1>
      </main>
    </Grid>
  );
}
