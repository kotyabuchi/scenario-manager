import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GlobalHeader } from './index';

// Next.js navigation hooks をモック
const mockPathname = vi.fn(() => '/scenarios');
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => mockRouter,
}));

// useAuth をモック（未ログイン状態）
vi.mock('@/context', () => ({
  useAuth: () => ({
    user: null,
    discordMeta: null,
    isLoading: false,
    isAuthenticated: false,
    isNewUser: false,
    setUser: vi.fn(),
    clearUser: vi.fn(),
  }),
}));

// useDiscordAuth をモック
vi.mock('@/hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({
    login: vi.fn(),
  }),
}));

describe('GlobalHeader', () => {
  describe('レンダリング', () => {
    it('ロゴが表示される', () => {
      render(<GlobalHeader />);
      expect(screen.getByText('シナプレ管理くん')).toBeInTheDocument();
    });

    it('ナビゲーションリンクが表示される', () => {
      render(<GlobalHeader />);
      expect(screen.getByRole('link', { name: 'ホーム' })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'シナリオ' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'セッション' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'スケジュール' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'ユーザー' }),
      ).toBeInTheDocument();
    });

    it('ロゴがホームへのリンクになっている', () => {
      render(<GlobalHeader />);
      const logoLink = screen.getByRole('link', { name: /シナプレ管理くん/i });
      expect(logoLink).toHaveAttribute('href', '/home');
    });
  });

  describe('未ログイン時', () => {
    it('ログインボタンが表示される', () => {
      render(<GlobalHeader />);
      expect(
        screen.getByRole('button', { name: /ログイン/i }),
      ).toBeInTheDocument();
    });
  });

  describe('ナビゲーション', () => {
    it('各リンクが正しいhrefを持つ', () => {
      render(<GlobalHeader />);
      expect(screen.getByRole('link', { name: 'ホーム' })).toHaveAttribute(
        'href',
        '/home',
      );
      expect(screen.getByRole('link', { name: 'シナリオ' })).toHaveAttribute(
        'href',
        '/scenarios',
      );
      expect(screen.getByRole('link', { name: 'セッション' })).toHaveAttribute(
        'href',
        '/sessions',
      );
      expect(
        screen.getByRole('link', { name: 'スケジュール' }),
      ).toHaveAttribute('href', '/schedules');
      expect(screen.getByRole('link', { name: 'ユーザー' })).toHaveAttribute(
        'href',
        '/users',
      );
    });
  });

  describe('シナリオ登録ボタン', () => {
    it('シナリオ画面で登録ボタンが表示される', () => {
      mockPathname.mockReturnValue('/scenarios');
      render(<GlobalHeader />);
      expect(
        screen.getByRole('link', { name: /シナリオを登録/i }),
      ).toBeInTheDocument();
    });

    it('シナリオ登録ボタンが正しいリンク先を持つ', () => {
      mockPathname.mockReturnValue('/scenarios');
      render(<GlobalHeader />);
      const registerLink = screen.getByRole('link', {
        name: /シナリオを登録/i,
      });
      expect(registerLink).toHaveAttribute('href', '/scenarios/new');
    });
  });

  describe('アクセシビリティ', () => {
    it('header要素が使用されている', () => {
      render(<GlobalHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('nav要素が使用されている', () => {
      render(<GlobalHeader />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('各ページでのアクティブ状態', () => {
    it('ホーム画面でレンダリングできる', () => {
      mockPathname.mockReturnValue('/home');
      render(<GlobalHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('セッション画面でレンダリングできる', () => {
      mockPathname.mockReturnValue('/sessions');
      render(<GlobalHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('ユーザー画面でレンダリングできる', () => {
      mockPathname.mockReturnValue('/users');
      render(<GlobalHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
