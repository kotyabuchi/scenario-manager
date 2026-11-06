import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/scenarios',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ isAuthenticated: false, isNewUser: false }),
}));

vi.mock('../AuthPrompt', () => ({
  AuthPromptProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthPrompt: () => vi.fn(),
}));

vi.mock('@/hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({ login: vi.fn() }),
}));

vi.mock('../FeedbackModal', () => ({ FeedbackModal: () => null }));
vi.mock('../ScenarioRegisterDialog', () => ({
  ScenarioRegisterDialog: () => null,
}));

import * as stories from './BottomNav.stories';

const { Default } = composeStories(stories);

describe('BottomNav', () => {
  it('現在のページを示すラベルと、未ログイン向けのメニューを表示する', async () => {
    const user = userEvent.setup();
    render(<Default />);

    const nav = screen.getByRole('navigation', {
      name: 'モバイルナビゲーション',
    });
    expect(within(nav).getByRole('link', { name: 'シナリオ' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
    const actions = screen.getByRole('region', { name: 'クイック操作' });
    expect(within(actions).getAllByRole('button')).toHaveLength(4);
    expect(
      within(actions).getByRole('button', { name: 'ログイン' }),
    ).toBeInTheDocument();
  });

  it('Escapeでメニューを閉じ、再び開閉ボタンを操作できる', async () => {
    const user = userEvent.setup();
    render(<Default />);

    await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('region', { name: 'クイック操作' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'メニューを開く' }),
    ).toHaveAttribute('aria-expanded', 'false');
  });
});
