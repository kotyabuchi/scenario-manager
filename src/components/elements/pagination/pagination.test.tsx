import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './pagination.stories';

const { Default, MiddlePage, LastPage, FewPages, ManyPages, Interactive } =
  composeStories(stories);

describe('Pagination', () => {
  describe('レンダリング', () => {
    // PGN-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(
        screen.getByRole('navigation', { name: 'ページネーション' }),
      ).toBeInTheDocument();
    });

    // PGN-02: ページ番号が表示される
    it('ページ番号が表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: 'ページ 1' }),
      ).toBeInTheDocument();
    });

    // PGN-03: 現在のページがアクティブになる
    it('現在のページにaria-current="page"が設定される', () => {
      render(<Default />);

      const currentPage = screen.getByRole('button', { name: 'ページ 1' });
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('ナビゲーションボタン', () => {
    // PGN-04: 前へボタンが表示される
    it('前へボタンが表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: '前のページ' }),
      ).toBeInTheDocument();
    });

    // PGN-05: 次へボタンが表示される
    it('次へボタンが表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: '次のページ' }),
      ).toBeInTheDocument();
    });

    // PGN-06: 最初のページで前へボタンが無効になる
    it('最初のページで前へボタンが無効になる', () => {
      render(<Default />);

      expect(screen.getByRole('button', { name: '前のページ' })).toBeDisabled();
    });

    // PGN-07: 最後のページで次へボタンが無効になる
    it('最後のページで次へボタンが無効になる', () => {
      render(<LastPage />);

      expect(screen.getByRole('button', { name: '次のページ' })).toBeDisabled();
    });

    // PGN-08: 中間ページでは両方のボタンが有効
    it('中間ページでは両方のボタンが有効', () => {
      render(<MiddlePage />);

      expect(
        screen.getByRole('button', { name: '前のページ' }),
      ).not.toBeDisabled();
      expect(
        screen.getByRole('button', { name: '次のページ' }),
      ).not.toBeDisabled();
    });
  });

  describe('インタラクション', () => {
    // PGN-09: ページクリックでonPageChangeが呼ばれる
    it('ページクリックでonPageChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(<Default onPageChange={handlePageChange} />);

      await user.click(screen.getByRole('button', { name: 'ページ 2' }));

      expect(handlePageChange).toHaveBeenCalledWith(2);
    });

    // PGN-10: 前へボタンクリックで前のページに移動
    it('前へボタンクリックで前のページに移動', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(<MiddlePage onPageChange={handlePageChange} />);

      await user.click(screen.getByRole('button', { name: '前のページ' }));

      expect(handlePageChange).toHaveBeenCalledWith(4);
    });

    // PGN-11: 次へボタンクリックで次のページに移動
    it('次へボタンクリックで次のページに移動', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(<MiddlePage onPageChange={handlePageChange} />);

      await user.click(screen.getByRole('button', { name: '次のページ' }));

      expect(handlePageChange).toHaveBeenCalledWith(6);
    });
  });

  describe('省略記号', () => {
    // PGN-12: 多いページ数で省略記号が表示される
    it('多いページ数で省略記号が表示される', () => {
      render(<ManyPages />);

      const ellipsis = screen.getAllByText('...');
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    // PGN-13: 少ないページ数では省略記号が表示されない
    it('少ないページ数では省略記号が表示されない', () => {
      render(<FewPages />);

      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
  });

  describe('ページ数表示', () => {
    // PGN-14: 少ないページ数で全てのページ番号が表示される
    it('少ないページ数で全てのページ番号が表示される', () => {
      render(<FewPages />);

      expect(
        screen.getByRole('button', { name: 'ページ 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'ページ 2' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'ページ 3' }),
      ).toBeInTheDocument();
    });

    // PGN-15: 最初と最後のページが常に表示される
    it('多いページ数でも最初と最後のページが表示される', () => {
      render(<ManyPages />);

      expect(
        screen.getByRole('button', { name: 'ページ 1' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'ページ 100' }),
      ).toBeInTheDocument();
    });
  });

  describe('キーボード操作', () => {
    // PGN-16: Tabでボタン間を移動できる
    it('Tabでボタン間を移動できる', async () => {
      const user = userEvent.setup();

      render(<MiddlePage />);

      await user.tab();

      // disabledでないボタンにフォーカスが移動する
      expect(screen.getByRole('button', { name: '前のページ' })).toHaveFocus();
    });

    // PGN-17: Enterでページを選択できる
    it('Enterでページを選択できる', async () => {
      const user = userEvent.setup();
      const handlePageChange = vi.fn();

      render(<Default onPageChange={handlePageChange} />);

      const page2Button = screen.getByRole('button', { name: 'ページ 2' });
      page2Button.focus();
      await user.keyboard('{Enter}');

      expect(handlePageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('アクセシビリティ', () => {
    // PGN-18: nav要素でナビゲーション領域をマークする
    it('nav要素でナビゲーション領域をマークする', () => {
      render(<Default />);

      expect(
        screen.getByRole('navigation', { name: 'ページネーション' }),
      ).toBeInTheDocument();
    });

    // PGN-19: 各ボタンにaria-labelが設定される
    it('各ボタンにaria-labelが設定される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: '前のページ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '次のページ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'ページ 1' }),
      ).toBeInTheDocument();
    });
  });

  describe('インタラクティブ', () => {
    // PGN-20: インタラクティブにページ移動できる
    it('インタラクティブにページ移動できる', async () => {
      const user = userEvent.setup();

      render(<Interactive />);

      // 最初は1ページ目
      expect(screen.getByRole('button', { name: 'ページ 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );

      // 2ページ目をクリック
      await user.click(screen.getByRole('button', { name: 'ページ 2' }));

      // 2ページ目がアクティブになる
      expect(screen.getByRole('button', { name: 'ページ 2' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });
  });
});
