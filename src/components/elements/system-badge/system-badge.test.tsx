import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './system-badge.stories';

const { Green, Purple, Orange, Blue, Red, Small, Medium } =
  composeStories(stories);

describe('SystemBadge', () => {
  describe('レンダリング', () => {
    // SYS-01: システム名が正しく表示される
    it('システム名が正しく表示される', () => {
      render(<Green />);

      expect(screen.getByText('CoC7版')).toBeInTheDocument();
    });

    // SYS-02: 各システムで正しい名前が表示される
    it('各システムで正しい名前が表示される', () => {
      const { rerender } = render(<Green />);
      expect(screen.getByText('CoC7版')).toBeInTheDocument();

      rerender(<Purple />);
      expect(screen.getByText('SW2.5')).toBeInTheDocument();

      rerender(<Orange />);
      expect(screen.getByText('CoC6版')).toBeInTheDocument();
    });
  });

  describe('カラーバリアント', () => {
    // SYS-03: color="green"で緑色になる
    it('color="green"で緑色になる', () => {
      render(<Green />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('data-color', 'green');
    });

    // SYS-04: color="purple"で紫色になる
    it('color="purple"で紫色になる', () => {
      render(<Purple />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('data-color', 'purple');
    });

    // SYS-05: color="orange"でオレンジ色になる
    it('color="orange"でオレンジ色になる', () => {
      render(<Orange />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('data-color', 'orange');
    });

    // SYS-06: color="blue"で青色になる
    it('color="blue"で青色になる', () => {
      render(<Blue />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('data-color', 'blue');
    });

    // SYS-07: color="red"で赤色になる
    it('color="red"で赤色になる', () => {
      render(<Red />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('data-color', 'red');
    });
  });

  describe('サイズバリアント', () => {
    // SYS-08: size="sm"が正しいサイズで表示される
    it('size="sm"が正しいサイズで表示される', () => {
      render(<Small />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('data-size', 'sm');
    });

    // SYS-09: size="md"が正しいサイズで表示される（デフォルト）
    it('size="md"が正しいサイズで表示される', () => {
      render(<Medium />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('data-size', 'md');
    });
  });

  describe('アクセシビリティ', () => {
    // SYS-10: aria-labelが設定される
    it('aria-labelが設定される', () => {
      render(<Green />);

      const badge = screen.getByRole('img');
      expect(badge).toHaveAttribute('aria-label', 'システム: CoC7版');
    });

    // SYS-11: role="img"が設定される
    it('role="img"が設定される', () => {
      render(<Green />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });
});
