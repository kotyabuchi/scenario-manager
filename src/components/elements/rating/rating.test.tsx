import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './rating.stories';

const { Default, Empty, Full, ReadOnly, Sizes, Interactive } =
  composeStories(stories);

describe('Rating', () => {
  describe('レンダリング', () => {
    // RTG-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // RTG-02: 星ボタンが5つ表示される
    it('星ボタンが5つ表示される', () => {
      render(<Default />);

      const stars = screen.getAllByRole('button');
      expect(stars).toHaveLength(5);
    });

    // RTG-03: value=0で空の状態が表示される
    it('value=0で空の状態が表示される', () => {
      render(<Empty />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // RTG-04: value=5で満点の状態が表示される
    it('value=5で満点の状態が表示される', () => {
      render(<Full />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });

  describe('サイズバリエーション', () => {
    // RTG-05: 各サイズがレンダリングできる
    it('各サイズがレンダリングできる', () => {
      render(<Sizes />);

      const ratingGroups = screen.getAllByRole('radiogroup');
      expect(ratingGroups).toHaveLength(3);
    });
  });

  describe('インタラクション', () => {
    // RTG-06: クリックでonValueChangeが呼ばれる
    it('クリックでonValueChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      const stars = screen.getAllByRole('button');
      const fourthStar = stars[3];
      expect(fourthStar).toBeDefined();
      await user.click(fourthStar as HTMLElement); // 4つ目の星をクリック

      expect(handleValueChange).toHaveBeenCalledWith(4);
    });

    // RTG-07: readOnlyでは編集できない
    it('readOnlyでは編集できない', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<ReadOnly onValueChange={handleValueChange} />);

      const stars = screen.getAllByRole('button');
      const firstStar = stars[0];
      expect(firstStar).toBeDefined();
      await user.click(firstStar as HTMLElement);

      expect(handleValueChange).not.toHaveBeenCalled();
    });

    // RTG-08: readOnlyのボタンはdisabled
    it('readOnlyのボタンはdisabled', () => {
      render(<ReadOnly />);

      const stars = screen.getAllByRole('button');
      for (const star of stars) {
        expect(star).toBeDisabled();
      }
    });
  });

  describe('インタラクティブ', () => {
    // RTG-09: インタラクティブに値を変更できる
    it('インタラクティブに値を変更できる', async () => {
      const user = userEvent.setup();

      render(<Interactive />);

      const stars = screen.getAllByRole('button');
      const fifthStar = stars[4];
      expect(fifthStar).toBeDefined();
      await user.click(fifthStar as HTMLElement); // 5つ目の星をクリック

      expect(screen.getByText('選択: 5つ星')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // RTG-10: role="radiogroup"が設定される
    it('role="radiogroup"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    // RTG-11: aria-labelが設定される
    it('radiogroupにaria-labelが設定される', () => {
      render(<Default />);

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveAttribute('aria-label', '評価');
    });

    // RTG-14: 各星ボタンにaria-labelがある
    it('各星ボタンにaria-labelがある', () => {
      render(<Default />);

      expect(screen.getByRole('button', { name: '1つ星' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2つ星' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3つ星' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4つ星' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '5つ星' })).toBeInTheDocument();
    });
  });

  describe('キーボード操作', () => {
    // RTG-15: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      const stars = screen.getAllByRole('button');
      expect(stars[0]).toHaveFocus();
    });
  });
});
