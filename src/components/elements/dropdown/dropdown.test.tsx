import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './dropdown.stories';

const { Default, NoSelection, WithDisabledItem, Interactive } =
  composeStories(stories);

describe('Dropdown', () => {
  describe('レンダリング', () => {
    // DRD-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: /新着順/i }),
      ).toBeInTheDocument();
    });

    // DRD-02: 選択なしの場合もレンダリングできる
    it('選択なしの場合もレンダリングできる', () => {
      render(<NoSelection />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('メニュー開閉', () => {
    // DRD-03: トリガークリックでメニューが開く
    it('トリガークリックでメニューが開く', async () => {
      const user = userEvent.setup();

      render(<Default />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    // DRD-04: メニューにアイテムが表示される
    it('メニューにアイテムが表示される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(
          screen.getByRole('menuitemradio', { name: '新着順' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('menuitemradio', { name: '高評価順' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('menuitemradio', { name: 'プレイ時間順' }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('menuitemradio', { name: '人数順' }),
        ).toBeInTheDocument();
      });
    });

    // DRD-05: 選択中のアイテムにチェックが表示される
    it('選択中のアイテムにaria-checked=trueが設定される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const selectedItem = screen.getByRole('menuitemradio', {
          name: /新着順/i,
        });
        expect(selectedItem).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  describe('インタラクション', () => {
    // DRD-06: アイテムクリックでonValueChangeが呼ばれる
    it('アイテムクリックでonValueChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitemradio', { name: '高評価順' }));

      expect(handleValueChange).toHaveBeenCalledWith('rating');
    });

    // DRD-07: アイテム選択後にメニューが閉じる
    it('アイテム選択後にメニューが閉じる', async () => {
      const user = userEvent.setup();

      render(<Interactive />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('menuitemradio', { name: '高評価順' }));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('無効なアイテム', () => {
    // DRD-08: disabledアイテムは選択できない
    it('disabledアイテムは選択できない', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<WithDisabledItem onValueChange={handleValueChange} />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const disabledItem = screen.getByRole('menuitemradio', {
        name: 'プレイ時間順',
      });
      expect(disabledItem).toBeDisabled();

      await user.click(disabledItem);

      expect(handleValueChange).not.toHaveBeenCalled();
    });
  });

  describe('キーボード操作', () => {
    // DRD-09: Tabでトリガーにフォーカスできる
    it('Tabでトリガーにフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      expect(screen.getByRole('button')).toHaveFocus();
    });

    // DRD-10: Enter/Spaceでメニューを開ける
    it('Enterでメニューを開ける', async () => {
      const user = userEvent.setup();

      render(<Default />);

      const trigger = screen.getByRole('button');
      trigger.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('Spaceでメニューを開ける', async () => {
      const user = userEvent.setup();

      render(<Default />);

      const trigger = screen.getByRole('button');
      trigger.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    // DRD-11: トリガーにaria-expandedが設定される
    it('メニュー開閉時にaria-expandedが更新される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    // DRD-12: トリガーにaria-haspopupが設定される
    it('トリガーにaria-haspopup="menu"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-haspopup',
        'menu',
      );
    });

    // DRD-13: メニューにrole="menu"が設定される
    it('メニューにrole="menu"が設定される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });
});
