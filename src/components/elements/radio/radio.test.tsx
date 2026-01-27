import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './radio.stories';

const { Default, Selected, WithDisabledItem, Disabled, Interactive } =
  composeStories(stories);

describe('Radio', () => {
  describe('レンダリング', () => {
    // RAD-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // RAD-02: ラジオボタンが表示される
    it('ラジオボタンが表示される', () => {
      render(<Default />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    // RAD-03: ラベルが表示される
    it('ラベルが表示される', () => {
      render(<Default />);

      expect(screen.getByText('オプション1')).toBeInTheDocument();
      expect(screen.getByText('オプション2')).toBeInTheDocument();
      expect(screen.getByText('オプション3')).toBeInTheDocument();
    });

    // RAD-04: 選択済み状態で正しく表示される
    it('選択済み状態で正しく表示される', () => {
      render(<Selected />);

      const option2 = screen.getByRole('radio', { name: 'オプション2' });
      expect(option2).toBeChecked();
    });
  });

  describe('インタラクション', () => {
    // RAD-05: クリックで選択できる
    it('クリックで選択できる', async () => {
      const user = userEvent.setup();

      render(<Interactive />);

      const option2 = screen.getByRole('radio', { name: 'オプション2' });
      await user.click(option2);

      expect(option2).toBeChecked();
    });

    // RAD-06: 排他的に1つだけ選択される
    it('排他的に1つだけ選択される', async () => {
      const user = userEvent.setup();

      render(<Interactive />);

      const option1 = screen.getByRole('radio', { name: 'オプション1' });
      const option2 = screen.getByRole('radio', { name: 'オプション2' });

      // 最初はオプション1が選択されている
      expect(option1).toBeChecked();
      expect(option2).not.toBeChecked();

      // オプション2をクリック
      await user.click(option2);

      // オプション2のみが選択されている
      expect(option1).not.toBeChecked();
      expect(option2).toBeChecked();
    });

    // RAD-07: onValueChangeが呼ばれる
    it('クリック時にonValueChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      await user.click(screen.getByRole('radio', { name: 'オプション2' }));

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: 'option2' }),
      );
    });
  });

  describe('無効状態', () => {
    // RAD-08: disabled項目はクリック無効
    it('disabled項目はクリック無効', async () => {
      const user = userEvent.setup();

      render(<WithDisabledItem />);

      const disabledOption = screen.getByRole('radio', {
        name: 'オプション3（無効）',
      });
      expect(disabledOption).toBeDisabled();

      await user.click(disabledOption);
      expect(disabledOption).not.toBeChecked();
    });

    // RAD-09: グループ全体がdisabledの場合
    it('グループ全体がdisabledの場合、全ての項目が無効', () => {
      render(<Disabled />);

      const radios = screen.getAllByRole('radio');
      for (const radio of radios) {
        expect(radio).toBeDisabled();
      }
    });
  });

  describe('キーボード操作', () => {
    // RAD-10: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      // radiogroupまたはradioのいずれかにフォーカスが当たる
      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.contains(document.activeElement)).toBe(true);
    });

    // RAD-11: 矢印キーで選択移動できる
    it('矢印キーで選択移動できる', async () => {
      const user = userEvent.setup();

      render(<Interactive />);

      // フォーカス
      await user.tab();

      // 下矢印で次の項目に移動
      await user.keyboard('{ArrowDown}');

      const option2 = screen.getByRole('radio', { name: 'オプション2' });
      expect(option2).toBeChecked();
    });
  });

  describe('アクセシビリティ', () => {
    // RAD-12: role="radiogroup"が設定される
    it('role="radiogroup"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // RAD-13: role="radio"が各項目に設定される
    it('role="radio"が各項目に設定される', () => {
      render(<Default />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    // RAD-14: aria-checked属性が正しく設定される
    it('aria-checked属性が正しく設定される', () => {
      render(<Selected />);

      const option1 = screen.getByRole('radio', { name: 'オプション1' });
      const option2 = screen.getByRole('radio', { name: 'オプション2' });

      expect(option1).not.toBeChecked();
      expect(option2).toBeChecked();
    });
  });
});
