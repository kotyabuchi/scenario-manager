import { fn } from '@storybook/test';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

import { AuthPromptDialog } from './AuthPromptDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Blocks/AuthPromptDialog',
  component: AuthPromptDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { options: INITIAL_VIEWPORTS },
  },
  args: {
    open: true,
    request: { message: 'お気に入りに追加するにはログインが必要です。' },
    onClose: fn(),
    onContinue: fn(),
  },
} satisfies Meta<typeof AuthPromptDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const MobileBottomSheet: Story = {
  globals: {
    viewport: { value: 'iphone14', isRotated: false },
  },
};
