import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './icon-button.stories';

const { Default } = composeStories(stories);

describe('IconButton', () => {
  describe('レンダリング', () => {
    // IBTN-01: 必須Propsで正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument();
    });

    // IBTN-02: アイコンが表示される
    it('アイコン（SVG）が表示される', () => {
      render(<Default />);

      const button = screen.getByRole('button');
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    // IBTN-03: variant="solid"が正しく表示される
    it('variant="solid"がレンダリングできる', () => {
      render(<Default variant="solid" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // IBTN-04: variant="ghost"が正しく表示される
    it('variant="ghost"がレンダリングできる', () => {
      render(<Default variant="ghost" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // IBTN-05: variant="subtle"が正しく表示される
    it('variant="subtle"がレンダリングできる', () => {
      render(<Default variant="subtle" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // IBTN-06: variant="outline"が正しく表示される
    it('variant="outline"がレンダリングできる', () => {
      render(<Default variant="outline" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('サイズバリエーション', () => {
    // IBTN-07: size="sm"が正しく表示される
    it('size="sm"がレンダリングできる', () => {
      render(<Default size="sm" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // IBTN-08: size="md"が正しく表示される
    it('size="md"がレンダリングできる', () => {
      render(<Default size="md" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // IBTN-09: size="lg"が正しく表示される
    it('size="lg"がレンダリングできる', () => {
      render(<Default size="lg" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    // IBTN-10: クリック時にonClickが呼ばれる
    it('クリック時にonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // IBTN-11: disabled時はonClickが呼ばれない
    it('disabled時はonClickが呼ばれない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default disabled onClick={handleClick} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    // IBTN-12: loading時はonClickが呼ばれない
    it('loading時はonClickが呼ばれない', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default loading onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('キーボード操作', () => {
    // IBTN-13: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      expect(screen.getByRole('button')).toHaveFocus();
    });

    // IBTN-14: Enterキーでクリックできる
    it('Enterキーでクリックできる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Default onClick={handleClick} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // IBTN-15: Spaceキーでクリックできる
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
    // IBTN-16: loading=trueでスピナーが表示される
    it('loading状態でレンダリングできる', () => {
      render(<Default loading />);

      // ボタンは表示される
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // IBTN-17: aria-label属性が設定される
    it('aria-label属性が設定される', () => {
      render(<Default />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Like');
    });

    // IBTN-18: disabled時にdisabled属性が設定される
    it('disabled時にdisabled属性が設定される', () => {
      render(<Default disabled />);

      expect(screen.getByRole('button')).toBeDisabled();
    });

    // IBTN-19: フォーカス可能
    it('フォーカス可能', () => {
      render(<Default />);

      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('ステータスバリエーション', () => {
    // IBTN-20: status="primary"がレンダリングできる
    it('status="primary"がレンダリングできる', () => {
      render(<Default status="primary" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // IBTN-21: status="danger"がレンダリングできる
    it('status="danger"がレンダリングできる', () => {
      render(<Default status="danger" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
