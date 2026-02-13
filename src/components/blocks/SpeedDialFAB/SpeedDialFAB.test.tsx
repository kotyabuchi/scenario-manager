import { composeStories } from '@storybook/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// SpeedDialFABが依存するモジュールをモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({
    login: vi.fn(),
    isNewUser: false,
    clearNewUser: vi.fn(),
  }),
}));

vi.mock('../FeedbackModal', () => ({
  FeedbackModal: () => null,
}));

import * as stories from './SpeedDialFAB.stories';

const { Authenticated, Unauthenticated } = composeStories(stories);

describe('SpeedDialFAB', () => {
  describe('レンダリング', () => {
    // SD-C01: FABボタンがレンダリングされる
    it('FABボタンがレンダリングされる', () => {
      render(<Authenticated />);

      expect(
        screen.getByRole('button', { name: 'メニューを開く' }),
      ).toBeInTheDocument();
    });
  });

  describe('メニュー展開', () => {
    // SD-C02: FABクリックでメニューが展開される
    it('FABクリックでメニューが展開される', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      const fab = screen.getByRole('button', { name: 'メニューを開く' });
      await user.click(fab);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // SD-C07: オーバーレイタップでメニューが閉じる
    it('オーバーレイタップでメニューが閉じる', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      // メニューを開く
      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // オーバーレイをクリック
      const overlay = screen.getByTestId('speed-dial-overlay');
      await user.click(overlay);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    // SD-C08: Escapeキーでメニューが閉じる
    it('Escapeキーでメニューが閉じる', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      // メニューを開く
      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Escapeキー押下
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('認証済みユーザー', () => {
    // SD-C03: 認証済みユーザーに5項目表示される
    it('5項目のメニューが表示される', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      const menu = screen.getByRole('menu');
      const items = within(menu).getAllByRole('menuitem');

      expect(items).toHaveLength(5);
      expect(items[0]).toHaveTextContent('シナリオ登録');
      expect(items[1]).toHaveTextContent('セッション募集');
      expect(items[2]).toHaveTextContent('シナリオ検索');
      expect(items[3]).toHaveTextContent('シェア');
      expect(items[4]).toHaveTextContent('フィードバック');
    });

    // SD-C05: 認証済みメニューにディバイダーがある
    it('アクション系とユーティリティ系の間にディバイダーがある', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      const menu = screen.getByRole('menu');
      const divider = within(menu).getByRole('separator');

      expect(divider).toBeInTheDocument();
    });

    // SD-C06: メニュー項目タップでアクション実行後に閉じる
    it('メニュー項目タップでアクション実行後に閉じる', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      // シェアをクリック
      const shareItem = screen.getByRole('menuitem', { name: /シェア/ });
      await user.click(shareItem);

      // メニューが閉じる
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('未認証ユーザー', () => {
    // SD-C04: 未認証ユーザーに3項目表示される
    it('3項目のメニューが表示される', async () => {
      const user = userEvent.setup();
      render(<Unauthenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      const menu = screen.getByRole('menu');
      const items = within(menu).getAllByRole('menuitem');

      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('シナリオ検索');
      expect(items[1]).toHaveTextContent('シェア');
      expect(items[2]).toHaveTextContent('ログイン');
    });

    // SD-C09: 未認証ユーザーにシナリオ登録が表示されない
    it('シナリオ登録が表示されない', async () => {
      const user = userEvent.setup();
      render(<Unauthenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      expect(
        screen.queryByRole('menuitem', { name: /シナリオ登録/ }),
      ).not.toBeInTheDocument();
    });

    // SD-C10: 未認証ユーザーにログインが表示される
    it('ログインが表示される', async () => {
      const user = userEvent.setup();
      render(<Unauthenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      expect(
        screen.getByRole('menuitem', { name: /ログイン/ }),
      ).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // SD-A01: FABに aria-label="メニューを開く" がある
    it('FABに aria-label="メニューを開く" がある', () => {
      render(<Authenticated />);

      const fab = screen.getByRole('button', { name: 'メニューを開く' });
      expect(fab).toHaveAttribute('aria-label', 'メニューを開く');
    });

    // SD-A02: aria-expanded が展開状態に応じて変化する
    it('aria-expanded が展開状態に応じて変化する', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      const fab = screen.getByRole('button', { name: 'メニューを開く' });

      // 閉じた状態
      expect(fab).toHaveAttribute('aria-expanded', 'false');

      // 開く
      await user.click(fab);
      expect(fab).toHaveAttribute('aria-expanded', 'true');
    });

    // SD-A03: メニューに role="menu" がある
    it('メニューに role="menu" がある', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    // SD-A04: メニュー項目に role="menuitem" がある
    it('メニュー項目に role="menuitem" がある', async () => {
      const user = userEvent.setup();
      render(<Authenticated />);

      await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

      const menu = screen.getByRole('menu');
      const items = within(menu).getAllByRole('menuitem');

      expect(items.length).toBeGreaterThan(0);
    });
  });
});
