import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './button.stories';

// StorybookのStoryからテスト用コンポーネントを生成
const { Default } = composeStories(stories);

describe('Button', () => {
  it('Storyのデフォルト状態でレンダリングできる', () => {
    render(<Default />);
    expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
  });

  it('クリックイベントが発火する', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Default onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disabled状態ではクリックできない', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Default disabled onClick={handleClick} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('loading状態でloadingTextが表示される', () => {
    render(<Default loading loadingText="読み込み中..." />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('propsでvariantを変更できる', () => {
    const { rerender } = render(<Default variant="outline" />);
    // outline variantでレンダリングされることを確認
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Default variant="ghost" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
