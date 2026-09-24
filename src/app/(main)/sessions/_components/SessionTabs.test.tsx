import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SessionTabs } from './SessionTabs';

import { AuthPromptContext } from '@/components/blocks/AuthPrompt/authPromptContext';

describe('SessionTabs', () => {
  it('未ログインでも参加予定と履歴を押せて、意図した行き先を渡す', async () => {
    const openAuthPrompt = vi.fn();
    const user = userEvent.setup();
    render(
      <AuthPromptContext value={openAuthPrompt}>
        <SessionTabs activeTab="public" isLoggedIn={false} />
      </AuthPromptContext>,
    );

    await user.click(screen.getByRole('button', { name: '参加予定' }));
    await user.click(screen.getByRole('button', { name: '参加履歴' }));

    expect(openAuthPrompt).toHaveBeenNthCalledWith(1, {
      message: '参加予定を確認するにはログインが必要です。',
      returnTo: '/sessions?tab=upcoming',
    });
    expect(openAuthPrompt).toHaveBeenNthCalledWith(2, {
      message: '参加履歴を確認するにはログインが必要です。',
      returnTo: '/sessions?tab=history',
    });
    expect(screen.getByRole('link', { name: '公開卓を探す' })).toHaveAttribute(
      'href',
      '/sessions?tab=public',
    );
  });

  it('ログイン済みでは通常のタブリンクに戻す', () => {
    render(<SessionTabs activeTab="upcoming" isLoggedIn />);

    expect(screen.getByRole('link', { name: '参加予定' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: '参加履歴' })).toHaveAttribute(
      'href',
      '/sessions?tab=history',
    );
  });
});
