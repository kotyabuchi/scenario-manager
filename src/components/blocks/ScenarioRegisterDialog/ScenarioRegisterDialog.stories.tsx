import { useState } from 'react';

import { ScenarioRegisterDialog } from './ScenarioRegisterDialog';

import { Button } from '@/components/elements/button/button';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ScenarioRegisterDialog> = {
  title: 'Blocks/ScenarioRegisterDialog',
  component: ScenarioRegisterDialog,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ScenarioRegisterDialog>;

export const Trigger: Story = {
  render: () => (
    <ScenarioRegisterDialog>
      <Button>シナリオを登録</Button>
    </ScenarioRegisterDialog>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>登録方法を選ぶ</Button>
        <ScenarioRegisterDialog
          open={open}
          onOpenChange={({ open: nextOpen }) => setOpen(nextOpen)}
        />
      </>
    );
  },
};
