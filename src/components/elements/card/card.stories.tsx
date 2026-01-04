import { Card } from './card';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => <Card {...args}>Card</Card>,
};
