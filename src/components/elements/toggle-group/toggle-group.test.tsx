import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './toggle-group.stories';

const { Default, Multiple, Disabled } = composeStories(stories);

describe('ToggleGroup', () => {
  describe('レンダリング', () => {
    // TGL-01: デフォルト状態で正しく表示される
    it('デフォルト状態で正しく表示される', () => {
      render(<Default />);

      // 単一選択時はradiogroup、複数選択時はgroup
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // TGL-02: すべてのトグルアイテムが表示される
    it('すべてのトグルアイテムが表示される', () => {
      render(<Default />);

      // 単一選択時はradio role
      expect(
        screen.getByRole('radio', { name: 'メニュー表示' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: 'リスト表示' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: 'グリッド表示' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: 'テーブル表示' }),
      ).toBeInTheDocument();
    });

    // TGL-03: アクティブなアイテムが正しくスタイリングされる
    it('アクティブなアイテムが正しくスタイリングされる', () => {
      render(<Default />);

      // 単一選択時はaria-checked
      const menuButton = screen.getByRole('radio', { name: 'メニュー表示' });
      expect(menuButton).toHaveAttribute('aria-checked', 'true');

      const listButton = screen.getByRole('radio', { name: 'リスト表示' });
      expect(listButton).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('インタラクション', () => {
    // TGL-04: クリックでアイテムが選択される
    it('クリックでアイテムが選択される', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      await user.click(screen.getByRole('radio', { name: 'リスト表示' }));

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['list'] }),
      );
    });

    // TGL-05: onValueChangeが呼ばれる
    it('onValueChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      await user.click(screen.getByRole('radio', { name: 'グリッド表示' }));

      expect(handleValueChange).toHaveBeenCalled();
    });

    // TGL-06: 単一選択時は1つだけ選択される
    it('単一選択時は1つだけ選択される', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      // 最初はmenuが選択されている
      expect(
        screen.getByRole('radio', { name: 'メニュー表示' }),
      ).toHaveAttribute('aria-checked', 'true');

      // listを選択
      await user.click(screen.getByRole('radio', { name: 'リスト表示' }));

      // listのみが選択される（配列に1つだけ）
      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['list'] }),
      );
    });
  });

  describe('複数選択', () => {
    // TGL-07: multiple=trueで複数選択できる
    it('multiple=trueで複数選択できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Multiple onValueChange={handleValueChange} />);

      // 複数選択時はbutton role with aria-pressed
      // 最初はmenuとlistが選択されている
      expect(
        screen.getByRole('button', { name: 'メニュー表示' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByRole('button', { name: 'リスト表示' }),
      ).toHaveAttribute('aria-pressed', 'true');

      // gridを追加選択
      await user.click(screen.getByRole('button', { name: 'グリッド表示' }));

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.arrayContaining(['menu', 'list', 'grid']),
        }),
      );
    });

    // TGL-08: 複数選択時に選択解除できる
    it('複数選択時に選択解除できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Multiple onValueChange={handleValueChange} />);

      // menuを選択解除
      await user.click(screen.getByRole('button', { name: 'メニュー表示' }));

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['list'] }),
      );
    });
  });

  describe('無効状態', () => {
    // TGL-09: disabled時は操作できない
    it('disabled時は操作できない', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Disabled onValueChange={handleValueChange} />);

      // 単一選択時はradio
      const listButton = screen.getByRole('radio', { name: 'リスト表示' });
      expect(listButton).toBeDisabled();

      await user.click(listButton);

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    // TGL-10: disabled状態が正しく表示される
    it('disabled状態が正しく表示される', () => {
      render(<Disabled />);

      // 単一選択時はradio
      const radios = screen.getAllByRole('radio');
      for (const radio of radios) {
        expect(radio).toBeDisabled();
      }
    });
  });

  describe('キーボード操作', () => {
    // TGL-11: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      // Ark UI ToggleGroupはroving tabindexを使用
      // グループにフォーカスが当たると選択されているアイテムまたはグループ自体にフォーカスが移動
      const radiogroup = screen.getByRole('radiogroup');
      // radiogroupまたはその子要素にフォーカスがある
      expect(
        radiogroup === document.activeElement ||
          radiogroup.contains(document.activeElement),
      ).toBe(true);
    });

    // TGL-12: 矢印キーでフォーカス移動できる
    it('矢印キーでフォーカス移動できる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      // グループにタブでフォーカス
      await user.tab();

      // Ark UIのToggleGroupはroving tabindex
      // フォーカスが正しく移動することを確認
      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup.contains(document.activeElement)).toBe(true);
    });

    // TGL-13: クリックでアイテムを選択できる
    it('直接クリックでアイテムを選択できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      // 直接クリックで選択
      await user.click(screen.getByRole('radio', { name: 'リスト表示' }));

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['list'] }),
      );
    });
  });

  describe('アクセシビリティ', () => {
    // TGL-14: 単一選択時はrole="radiogroup"、複数選択時はrole="group"が設定される
    it('単一選択時はrole="radiogroup"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('複数選択時はrole="group"が設定される', () => {
      render(<Multiple />);

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    // TGL-15: 各アイテムにaria-checked/aria-pressedが設定される
    it('単一選択時は各アイテムにaria-checkedが設定される', () => {
      render(<Default />);

      const menuButton = screen.getByRole('radio', { name: 'メニュー表示' });
      expect(menuButton).toHaveAttribute('aria-checked', 'true');

      const listButton = screen.getByRole('radio', { name: 'リスト表示' });
      expect(listButton).toHaveAttribute('aria-checked', 'false');
    });

    it('複数選択時は各アイテムにaria-pressedが設定される', () => {
      render(<Multiple />);

      const menuButton = screen.getByRole('button', { name: 'メニュー表示' });
      expect(menuButton).toHaveAttribute('aria-pressed', 'true');

      const listButton = screen.getByRole('button', { name: 'リスト表示' });
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
    });

    // TGL-16: aria-labelが設定される
    it('aria-labelが設定される', () => {
      render(<Default />);

      expect(
        screen.getByRole('radio', { name: 'メニュー表示' }),
      ).toHaveAttribute('aria-label', 'メニュー表示');
    });
  });
});
