import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './checkbox.stories';

const { Default, Checked, Unchecked, Disabled, WithLabel } =
  composeStories(stories);

describe('Checkbox', () => {
  describe('レンダリング', () => {
    // CHK-01: 未チェック状態で正しく表示される
    it('未チェック状態でレンダリングできる', () => {
      render(<Unchecked />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    // CHK-02: チェック状態で正しく表示される
    it('チェック状態でレンダリングできる', () => {
      render(<Checked />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    // CHK-03: ラベルが表示される
    it('ラベルが表示される', () => {
      render(<WithLabel />);

      expect(screen.getByText(/利用規約に同意/)).toBeInTheDocument();
    });

    // CHK-04: disabled状態で正しく表示される
    it('disabled状態でレンダリングできる', () => {
      render(<Disabled />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });
  });

  describe('インタラクション', () => {
    // CHK-05: クリックでチェック切り替え
    it('クリックでチェック状態が切り替わる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Default onCheckedChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalled();
    });

    // CHK-06: onCheckedChangeが呼ばれる
    it('onCheckedChangeにchecked状態が渡される', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Unchecked onCheckedChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({ checked: true }),
      );
    });

    // CHK-07: disabled時はクリック無効
    it('disabled時はクリックできない', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Disabled onCheckedChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('キーボード操作', () => {
    // CHK-08: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveFocus();
    });

    // CHK-09: Spaceでチェック切り替え
    it('Spaceでチェック状態が切り替わる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Default onCheckedChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      await user.keyboard(' ');

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    // CHK-10: role="checkbox"が設定される
    it('role="checkbox"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    // CHK-11: aria-checked属性が正しく設定される
    it('aria-checked属性が正しく設定される', () => {
      const { rerender } = render(<Unchecked />);
      // HiddenInputのネイティブcheckboxでは、aria-checkedではなくcheckedプロパティで判定
      expect(screen.getByRole('checkbox')).not.toBeChecked();

      rerender(<Checked />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });
});
