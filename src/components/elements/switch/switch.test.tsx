import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './switch.stories';

const { Default, On, Disabled, DisabledOn, NoLabel, Interactive } =
  composeStories(stories);

describe('Switch', () => {
  describe('レンダリング', () => {
    // SWT-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    // SWT-02: オン状態で正しく表示される
    it('オン状態で正しく表示される', () => {
      render(<On />);

      const switchEl = screen.getByRole('checkbox');
      expect(switchEl).toBeChecked();
    });

    // SWT-03: オフ状態で正しく表示される
    it('オフ状態で正しく表示される', () => {
      render(<Default />);

      const switchEl = screen.getByRole('checkbox');
      expect(switchEl).not.toBeChecked();
    });

    // SWT-04: ラベルが表示される
    it('ラベルが表示される', () => {
      render(<Default />);

      expect(screen.getByText('ラベル')).toBeInTheDocument();
    });

    // SWT-05: ラベルなしでもレンダリングできる
    it('ラベルなしでもレンダリングできる', () => {
      render(<NoLabel />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    // SWT-06: disabled状態で正しく表示される
    it('disabled状態で正しく表示される', () => {
      render(<Disabled />);

      const switchEl = screen.getByRole('checkbox');
      expect(switchEl).toBeDisabled();
    });

    // SWT-07: disabled + オン状態でも表示される
    it('disabled + オン状態でも表示される', () => {
      render(<DisabledOn />);

      const switchEl = screen.getByRole('checkbox');
      expect(switchEl).toBeDisabled();
      expect(switchEl).toBeChecked();
    });
  });

  describe('インタラクション', () => {
    // SWT-08: クリックでオン/オフ切り替え
    it('クリックでオン/オフ切り替え', async () => {
      const user = userEvent.setup();

      render(<Interactive />);

      const switchEl = screen.getByRole('checkbox');
      expect(switchEl).not.toBeChecked();

      await user.click(switchEl);

      expect(switchEl).toBeChecked();
    });

    // SWT-09: onCheckedChangeが呼ばれる
    it('onCheckedChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = vi.fn();

      render(<Default onCheckedChange={handleCheckedChange} />);

      await user.click(screen.getByRole('checkbox'));

      expect(handleCheckedChange).toHaveBeenCalledWith(
        expect.objectContaining({ checked: true }),
      );
    });

    // SWT-10: disabled時はクリック無効
    it('disabled時はクリック無効', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = vi.fn();

      render(<Disabled onCheckedChange={handleCheckedChange} />);

      const switchEl = screen.getByRole('checkbox');
      await user.click(switchEl);

      expect(handleCheckedChange).not.toHaveBeenCalled();
    });
  });

  describe('キーボード操作', () => {
    // SWT-11: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      expect(screen.getByRole('checkbox')).toHaveFocus();
    });

    // SWT-12: Spaceで切り替え
    it('Spaceで切り替え', async () => {
      const user = userEvent.setup();
      const handleCheckedChange = vi.fn();

      render(<Default onCheckedChange={handleCheckedChange} />);

      const switchEl = screen.getByRole('checkbox');
      switchEl.focus();
      await user.keyboard(' ');

      expect(handleCheckedChange).toHaveBeenCalledWith(
        expect.objectContaining({ checked: true }),
      );
    });

    // SWT-13: Enterで切り替えは削除（checkboxの標準動作ではない）
  });

  describe('アクセシビリティ', () => {
    // SWT-14: role="checkbox"が設定される（Ark UI Switchはcheckbox）
    it('checkboxロールが設定される', () => {
      render(<Default />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    // SWT-15: checked属性が正しく設定される
    it('checked属性が正しく設定される', () => {
      const { rerender } = render(<Default />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();

      rerender(<On />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });
});
