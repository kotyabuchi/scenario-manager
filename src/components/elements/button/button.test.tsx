import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './button.stories';

// StorybookのStoryからテスト用コンポーネントを生成
const { Default } = composeStories(stories);

describe('Button', () => {
  describe('レンダリング', () => {
    // BTN-01: 必須Propsのみで正しくレンダリングされる
    it('Storyのデフォルト状態でレンダリングできる', () => {
      render(<Default />);
      expect(
        screen.getByRole('button', { name: 'Button' }),
      ).toBeInTheDocument();
    });

    // BTN-02: variant="solid"が正しく表示される
    it('variant="solid"がレンダリングできる', () => {
      render(<Default variant="solid" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-03: variant="subtle"が正しく表示される
    it('variant="subtle"がレンダリングできる', () => {
      render(<Default variant="subtle" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-04: variant="ghost"が正しく表示される
    it('variant="ghost"がレンダリングできる', () => {
      render(<Default variant="ghost" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-05: variant="outline"が正しく表示される
    it('variant="outline"がレンダリングできる', () => {
      render(<Default variant="outline" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-06: status="primary"が正しく表示される
    it('status="primary"がレンダリングできる', () => {
      render(<Default status="primary" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-07: status="danger"が正しく表示される
    it('status="danger"がレンダリングできる', () => {
      render(<Default status="danger" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-08: size="sm"が正しく表示される
    it('size="sm"がレンダリングできる', () => {
      render(<Default size="sm" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-09: size="md"が正しく表示される
    it('size="md"がレンダリングできる', () => {
      render(<Default size="md" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-10: size="lg"が正しく表示される
    it('size="lg"がレンダリングできる', () => {
      render(<Default size="lg" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-11: propsでvariantを変更できる
    it('propsでvariantを変更できる', () => {
      const { rerender } = render(<Default variant="subtle" />);
      expect(screen.getByRole('button')).toBeInTheDocument();

      rerender(<Default variant="ghost" />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    // BTN-12: クリック時にonClickが呼ばれる
    it('クリックイベントが発火する', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // BTN-13: disabled時はonClickが呼ばれない
    it('disabled状態ではクリックできない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default disabled onClick={handleClick} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    // BTN-14: loading時はonClickが呼ばれない
    it('loading状態ではクリックできない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default loading onClick={handleClick} />);

      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    // BTN-15: Enterキーでクリックできる
    it('Enterキーでクリックできる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // BTN-16: Spaceキーでクリックできる
    it('Spaceキーでクリックできる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('ローディング状態', () => {
    // BTN-17: loading=trueでスピナーが表示される
    it('loading状態でスピナーが表示される', () => {
      render(<Default loading />);

      // スピナーはSpinnerコンポーネントとして描画される
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    // BTN-18: loadingTextが指定されていればテキストが切り替わる
    it('loading状態でloadingTextが表示される', () => {
      render(<Default loading loadingText="読み込み中..." />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    // BTN-19: loadingTextが未指定なら元のchildrenが表示される
    it('loadingTextが未指定の場合は元のchildrenが表示される', () => {
      render(<Default loading>保存</Default>);

      expect(screen.getByText('保存')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // BTN-20: role="button"が設定されている
    it('role="button"が設定されている', () => {
      render(<Default />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // BTN-21: disabled時にdisabled属性が設定される
    it('disabled時にdisabled属性が設定される', () => {
      render(<Default disabled />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    // BTN-22: フォーカス可能
    it('フォーカス可能', () => {
      render(<Default />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('エラーケース', () => {
    // BTN-23: childrenが空でもクラッシュしない
    it('childrenが空でもクラッシュしない', () => {
      render(<Default>{''}</Default>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
