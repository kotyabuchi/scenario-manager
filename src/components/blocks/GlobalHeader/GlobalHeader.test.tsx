import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GlobalHeader } from './index';

import type { AuthContextType } from '@/context/auth-context';

// Next.js navigation hooks をモック
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// useAuth をモック（デフォルト: 未ログイン状態）
const unauthenticatedUser = (): AuthContextType => ({
  user: null,
  discordMeta: null,
  isLoading: false,
  isAuthenticated: false,
  isNewUser: false,
  setUser: vi.fn(),
  clearUser: vi.fn(),
});

const mockUseAuth = vi.fn<() => AuthContextType>(unauthenticatedUser);

vi.mock('@/context', () => ({
  useAuth: () => mockUseAuth(),
}));

// useDiscordAuth をモック
vi.mock('@/hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({
    login: vi.fn(),
  }),
}));

afterEach(() => {
  mockUseAuth.mockImplementation(unauthenticatedUser);
});

describe('GlobalHeader', () => {
  describe('レンダリング', () => {
    it('ロゴが表示される', () => {
      render(<GlobalHeader />);
      expect(screen.getByText('シナプレ管理くん')).toBeInTheDocument();
    });

    it('ロゴがホームへのリンクになっている', () => {
      render(<GlobalHeader />);
      const logoLink = screen.getByRole('link', { name: /シナプレ管理くん/i });
      expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('デスクトップナビは持たない（モバイル専用トップバー）', () => {
      render(<GlobalHeader />);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
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

  describe('ログイン時', () => {
    it('アバターボタンが表示される', () => {
      mockUseAuth.mockReturnValue({
        user: {
          userId: 'test-user',
          discordId: 'discord-123',
          nickname: 'Test',
          avatar: null,
          role: 'MEMBER',
        },
        discordMeta: null,
        isLoading: false,
        isAuthenticated: true,
        isNewUser: false,
        setUser: vi.fn(),
        clearUser: vi.fn(),
      });
      render(<GlobalHeader />);
      expect(
        screen.getByRole('button', { name: 'プロフィール' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /ログイン/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('header要素が使用されている', () => {
      render(<GlobalHeader />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
