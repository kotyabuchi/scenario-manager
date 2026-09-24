import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AuthPromptDialog } from './AuthPromptDialog';

describe('AuthPromptDialog', () => {
  it('操作理由を表示し、Discord認証を開始できる', async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(
      <AuthPromptDialog
        open
        request={{ message: 'お気に入りに追加するにはログインが必要です。' }}
        onClose={vi.fn()}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'お気に入りに追加するにはログインが必要です。',
    );
    await user.click(screen.getByRole('button', { name: 'Discordで続ける' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('閉じる操作で元の画面に留まれる', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <AuthPromptDialog
        open
        request={{ message: 'ホームを見るにはログインが必要です。' }}
        onClose={onClose}
        onContinue={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'あとで' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
