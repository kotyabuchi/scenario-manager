import { useState } from 'react';
import { fn } from '@storybook/test';

import { FeedbackModal } from './FeedbackModal';

import { Button } from '@/components/elements/button/button';
import { FeedbackCategories } from '@/db/enum';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/FeedbackModal',
  component: FeedbackModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof FeedbackModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {};

export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>フィードバックを開く</Button>
        <FeedbackModal
          {...args}
          open={open}
          onOpenChange={({ open: nextOpen }) => setOpen(nextOpen)}
        />
      </>
    );
  },
};

export const Edit: Story = {
  args: {
    editTarget: {
      feedbackId: 'sample-feedback',
      category: FeedbackCategories.BUG.value,
      title: '検索条件を変更すると表示が崩れる',
      description: 'シナリオ一覧で検索条件を変更した直後に表示が崩れます。',
    },
  },
};
