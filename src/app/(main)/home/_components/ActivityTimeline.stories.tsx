import { mockActivities } from './_mocks';
import { ActivityTimeline } from './ActivityTimeline';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Dashboard/ActivityTimeline',
  component: ActivityTimeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'gray',
      values: [{ name: 'gray', value: '#F9FAFB' }],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActivityTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 4種のアクティビティが混在 */
export const Default: Story = {
  args: {
    activities: mockActivities,
  },
};

/** アクティビティなし */
export const Empty: Story = {
  args: {
    activities: [],
  },
};
