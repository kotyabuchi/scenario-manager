import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './chip.stories';

const { Default, Selected, Removable, Disabled, Sizes } =
  composeStories(stories);

describe('Chip', () => {
  describe('レンダリング', () => {
    // CHP-01: 必須Propsのみで正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: /CoC7版/i }),
      ).toBeInTheDocument();
    });

    // CHP-02: labelが正しく表示される
    it('labelが正しく表示される', () => {
      render(<Default />);

      expect(screen.getByText('CoC7版')).toBeInTheDocument();
    });

    // CHP-03: selected=trueで選択状態のスタイルになる
    it('selected=trueで選択状態になる', () => {
      render(<Selected />);

      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('aria-pressed', 'true');
    });

    // CHP-04: selected=falseで非選択状態のスタイルになる
    it('selected=falseで非選択状態になる', () => {
      render(<Default />);

      const chip = screen.getByRole('button');
      expect(chip).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('サイズバリエーション', () => {
    // CHP-05: size="sm"が正しく表示される
    it('size="sm"がレンダリングできる', () => {
      render(<Sizes />);

      expect(screen.getByText('Small')).toBeInTheDocument();
    });

    // CHP-06: size="md"が正しく表示される
    it('size="md"がレンダリングできる', () => {
      render(<Sizes />);

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    // CHP-07: size="lg"が正しく表示される
    it('size="lg"がレンダリングできる', () => {
      render(<Sizes />);

      expect(screen.getByText('Large')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    // CHP-08: クリック時にonClickが呼ばれる
    it('クリック時にonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // CHP-09: disabled時はonClickが呼ばれない
    it('disabled時はonClickが呼ばれない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Disabled onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('削除機能', () => {
    // CHP-10: removable=trueで削除ボタンが表示される
    it('removable=trueで削除ボタンが表示される', () => {
      render(<Removable />);

      expect(screen.getByLabelText(/ホラーを削除/i)).toBeInTheDocument();
    });

    // CHP-11: 削除ボタンクリック時にonRemoveが呼ばれる
    it('削除ボタンクリック時にonRemoveが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleRemove = vi.fn();

      render(<Removable onRemove={handleRemove} />);

      await user.click(screen.getByLabelText(/ホラーを削除/i));
      expect(handleRemove).toHaveBeenCalledTimes(1);
    });

    // CHP-12: 削除ボタンクリックでonClickは呼ばれない（イベント伝播停止）
    it('削除ボタンクリックでonClickは呼ばれない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      const handleRemove = vi.fn();

      render(<Removable onClick={handleClick} onRemove={handleRemove} />);

      await user.click(screen.getByLabelText(/ホラーを削除/i));

      expect(handleRemove).toHaveBeenCalledTimes(1);
      expect(handleClick).not.toHaveBeenCalled();
    });

    // CHP-13: removable=falseで削除ボタンが非表示
    it('removable=falseで削除ボタンが非表示', () => {
      render(<Default />);

      expect(screen.queryByLabelText(/を削除/i)).not.toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    // CHP-14: disabled=trueでボタンが無効になる
    it('disabled=trueでボタンが無効になる', () => {
      render(<Disabled />);

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('キーボード操作', () => {
    // CHP-15: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      expect(screen.getByRole('button')).toHaveFocus();
    });

    // CHP-16: Enter/Spaceでクリックできる
    it('Enterでクリックできる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('Spaceでクリックできる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      const chip = screen.getByRole('button');
      chip.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ', () => {
    // CHP-17: aria-pressed属性が正しく設定される
    it('aria-pressed属性が選択状態を反映する', () => {
      const { rerender } = render(<Default />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-pressed',
        'false',
      );

      rerender(<Selected />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    // CHP-18: 削除ボタンにaria-labelがある
    it('削除ボタンにaria-labelがある', () => {
      render(<Removable />);

      const removeButton = screen.getByLabelText(/ホラーを削除/i);
      expect(removeButton).toBeInTheDocument();
    });
  });
});
