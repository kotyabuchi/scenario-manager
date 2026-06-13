import {
  createMySession,
  createPublicSession,
} from '../../__mocks__/sessionMocks';
import { EmptyState } from '../EmptyState';
import { SessionList } from '../SessionList';

import type { Meta, StoryObj } from '@storybook/react';

type PageMockProps = {
  variant: 'upcoming' | 'history' | 'public';
  isEmpty: boolean;
};

const SessionListPageMock = ({ variant, isEmpty }: PageMockProps) => {
  if (isEmpty) {
    const emptyType =
      variant === 'upcoming'
        ? 'upcoming'
        : variant === 'history'
          ? 'history'
          : 'public';
    return <EmptyState type={emptyType} />;
  }

  if (variant === 'public') {
    return (
      <SessionList
        sessions={[
          createPublicSession(),
          createPublicSession({
            gameSessionId: '01HSESSION0000000000000002',
            sessionName: '星辰の間 - 新規卓',
            scenarioName: '星辰の間',
            systemName: 'インセイン',
          }),
          createPublicSession({
            gameSessionId: '01HSESSION0000000000000003',
            sessionName: '毒入りスープ',
            scenarioName: '毒入りスープ',
            participantCount: 0,
            maxPlayer: 2,
          }),
        ]}
        variant="public"
      />
    );
  }

  return (
    <SessionList
      sessions={[
        createMySession({ myRole: 'KEEPER' }),
        createMySession({
          gameSessionId: '01HSESSION0000000000000002',
          sessionName: '星辰の間',
          myRole: 'PLAYER',
          sessionPhase: variant === 'history' ? 'COMPLETED' : 'RECRUITING',
        }),
      ]}
      variant="my"
    />
  );
};

const meta = {
  title: 'Sessions/一覧/PageMock',
  component: SessionListPageMock,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SessionListPageMock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UpcomingWithSessions: Story = {
  args: { variant: 'upcoming', isEmpty: false },
};

export const UpcomingEmpty: Story = {
  args: { variant: 'upcoming', isEmpty: true },
};

export const HistoryWithSessions: Story = {
  args: { variant: 'history', isEmpty: false },
};

export const PublicWithSessions: Story = {
  args: { variant: 'public', isEmpty: false },
};

export const PublicEmpty: Story = {
  args: { variant: 'public', isEmpty: true },
};
