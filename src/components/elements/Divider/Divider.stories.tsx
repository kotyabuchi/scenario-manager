import { Divider } from './Divider';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Elements/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    width: {
      control: { type: 'range', min: 10, max: 100, step: 5 },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * フル幅（既定）
 */
export const Default: Story = {};

/**
 * 親幅の50%（中央寄せ）
 */
export const Half: Story = {
  args: { width: 50 },
};

/**
 * 各幅の比較
 */
export const Widths: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Divider />
      <Divider width={75} />
      <Divider width={50} />
      <Divider width={25} />
    </div>
  ),
};
