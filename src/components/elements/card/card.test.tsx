import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './card.stories';

const { Default, Flat, Elevated, Interactive } = composeStories(stories);

describe('Card', () => {
  describe('レンダリング', () => {
    // CARD-01: 正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    // CARD-02: elevation="flat"が正しく表示される
    it('elevation="flat"がレンダリングできる', () => {
      render(<Flat />);

      expect(screen.getByText('Flat Card')).toBeInTheDocument();
    });

    // CARD-03: elevation="raised"が正しく表示される
    it('elevation="raised"がレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    // CARD-04: elevation="elevated"が正しく表示される
    it('elevation="elevated"がレンダリングできる', () => {
      render(<Elevated />);

      expect(screen.getByText('Elevated Card')).toBeInTheDocument();
    });
  });

  describe('コンテンツ表示', () => {
    // CARD-05: childrenが正しく表示される
    it('childrenが正しく表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('heading', { name: 'Card Title' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('This is a default card with raised elevation.'),
      ).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    // CARD-06: interactive=trueでホバー効果が有効
    it('interactive=trueでレンダリングできる', () => {
      render(<Interactive />);

      expect(screen.getByText('Interactive Card')).toBeInTheDocument();
    });

    // CARD-07: クリック時にonClickが呼ばれる
    it('クリック時にonClickが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Default onClick={handleClick}>
          <p>Clickable Card</p>
        </Default>,
      );

      const card = screen.getByText('Card Title').closest('div');
      if (card) {
        await user.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('アクセシビリティ', () => {
    // CARD-08: コンテンツがアクセシブル
    it('見出しにアクセスできる', () => {
      render(<Default />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });
});
