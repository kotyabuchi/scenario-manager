import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ParticipantsSection } from './ParticipantsSection';

import { SessionPhases } from '@/db/enum';

describe('ParticipantsSection', () => {
  it('manager かつ RECRUITING のとき申請管理ボタンを表示する', () => {
    render(
      <ParticipantsSection
        participants={[]}
        userRole="manager"
        currentUserId={null}
        maxPlayer={4}
        creatorUserId="creator-1"
        sessionId="session-1"
        sessionPhase={SessionPhases.RECRUITING.value}
      />,
    );

    expect(screen.getByRole('link', { name: '申請管理' })).toBeInTheDocument();
  });

  it('manager でも COMPLETED のとき申請管理ボタンを表示しない', () => {
    render(
      <ParticipantsSection
        participants={[]}
        userRole="manager"
        currentUserId={null}
        maxPlayer={4}
        creatorUserId="creator-1"
        sessionId="session-1"
        sessionPhase={SessionPhases.COMPLETED.value}
      />,
    );

    expect(
      screen.queryByRole('link', { name: '申請管理' }),
    ).not.toBeInTheDocument();
  });
});
