import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Tag } from './Tag';
import * as stories from './Tag.stories';

const { Default, NoColor } = composeStories(stories);

describe('Tag', () => {
  // TAG-01: ラベルが表示される
  it('ラベルが表示される', () => {
    render(<Default />);

    expect(screen.getByText('ホラー')).toBeInTheDocument();
  });

  // TAG-02: 静的表示（button ではない）
  it('button ではなく静的に描画される', () => {
    render(<Default />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // TAG-03: color から CSS 変数を注入する
  it('color 指定時に --pill-bg / --pill-text を注入する', () => {
    render(<Tag label="ホラー" color="oklch(0.65 0.18 20)" />);

    const root = screen.getByText('ホラー').parentElement;
    expect(root?.getAttribute('style')).toContain('--pill-bg');
    expect(root?.getAttribute('style')).toContain('--pill-text');
  });

  // TAG-04: color 未設定では CSS 変数を注入しない（グレーフォールバック）
  it('color 未設定では CSS 変数を注入しない', () => {
    render(<NoColor />);

    const root = screen.getByText('未分類').parentElement;
    expect(root?.getAttribute('style') ?? '').not.toContain('--pill-bg');
  });

  // TAG-05: 不正な color もフォールバックする
  it('不正な color はグレーにフォールバックする', () => {
    render(<Tag label="ホラー" color="#ff0000" />);

    const root = screen.getByText('ホラー').parentElement;
    expect(root?.getAttribute('style') ?? '').not.toContain('--pill-bg');
  });
});
