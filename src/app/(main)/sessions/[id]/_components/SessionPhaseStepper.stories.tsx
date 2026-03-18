import { SessionPhaseStepper } from './SessionPhaseStepper';

import { SessionPhases } from '@/db/enum';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Sessions/詳細/SessionPhaseStepper',
  component: SessionPhaseStepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    phase: SessionPhases.RECRUITING.value,
  },
} satisfies Meta<typeof SessionPhaseStepper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Recruiting: Story = {
  args: {
    phase: SessionPhases.RECRUITING.value,
  },
};

export const Preparation: Story = {
  args: {
    phase: SessionPhases.PREPARATION.value,
  },
};

export const InProgress: Story = {
  args: {
    phase: SessionPhases.IN_PROGRESS.value,
  },
};

export const Completed: Story = {
  args: {
    phase: SessionPhases.COMPLETED.value,
  },
};

export const Cancelled: Story = {
  args: {
    phase: SessionPhases.CANCELLED.value,
  },
};

export const AllPhases: Story = {
  render: () => {
    const phases = [
      SessionPhases.RECRUITING.value,
      SessionPhases.PREPARATION.value,
      SessionPhases.IN_PROGRESS.value,
      SessionPhases.COMPLETED.value,
      SessionPhases.CANCELLED.value,
    ] as const;

    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {phases.map((phase) => (
          <div key={phase}>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 12,
                color: '#6b7280',
                fontWeight: 600,
              }}
            >
              {phase}
            </p>
            <SessionPhaseStepper phase={phase} />
          </div>
        ))}
      </div>
    );
  },
};
