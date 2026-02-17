import { SystemNotice } from './SystemNotice';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Dashboard/SystemNotice',
  component: SystemNotice,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SystemNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** デフォルト表示 */
export const Default: Story = {};
