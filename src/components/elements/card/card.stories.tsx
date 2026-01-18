import { Card } from './card';

import { css } from '@/styled-system/css';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    elevation: {
      control: 'select',
      options: ['flat', 'raised', 'elevated'],
    },
    bordered: {
      control: 'boolean',
    },
    interactive: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

const containerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 'lg',
  p: 'lg',
  bg: 'layer.base',
});

export const Default: Story = {
  args: {
    elevation: 'raised',
  },
  render: (args) => (
    <div className={containerStyle}>
      <Card {...args}>
        <h3>Card Title</h3>
        <p>This is a default card with raised elevation.</p>
      </Card>
    </div>
  ),
};

export const Flat: Story = {
  args: {
    elevation: 'flat',
  },
  render: (args) => (
    <div className={containerStyle}>
      <Card {...args}>
        <h3>Flat Card</h3>
        <p>This card has no shadow, only background color.</p>
      </Card>
    </div>
  ),
};

export const Elevated: Story = {
  args: {
    elevation: 'elevated',
  },
  render: (args) => (
    <div className={containerStyle}>
      <Card {...args}>
        <h3>Elevated Card</h3>
        <p>This card has a stronger shadow for more depth.</p>
      </Card>
    </div>
  ),
};

export const Interactive: Story = {
  args: {
    elevation: 'raised',
    interactive: true,
  },
  render: (args) => (
    <div className={containerStyle}>
      <Card {...args}>
        <h3>Interactive Card</h3>
        <p>Hover over this card to see the effect.</p>
      </Card>
    </div>
  ),
};

export const Bordered: Story = {
  args: {
    elevation: 'flat',
    bordered: true,
  },
  render: (args) => (
    <div className={containerStyle}>
      <Card {...args}>
        <h3>Bordered Card</h3>
        <p>This card has a subtle border (use sparingly).</p>
      </Card>
    </div>
  ),
};

export const AllVariants: Story = {
  args: {},
  render: () => (
    <div className={containerStyle}>
      <Card elevation="flat">
        <h3>Flat</h3>
        <p>Background only</p>
      </Card>
      <Card elevation="raised">
        <h3>Raised</h3>
        <p>Background + subtle shadow</p>
      </Card>
      <Card elevation="elevated">
        <h3>Elevated</h3>
        <p>Background + stronger shadow</p>
      </Card>
      <Card elevation="raised" interactive>
        <h3>Interactive</h3>
        <p>Hover to see effect</p>
      </Card>
    </div>
  ),
};
