import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SideMenu } from './SideMenu';

import type { AuthContextType } from '@/context/auth-context';

// Next.js navigation hooks をモック
const mockPathname = vi.fn(() => '/home');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// useAuth をモック（デフォルト: 未ログイン）
const mockUseAuth = vi.fn<() => AuthContextType>(() => ({
  user: null,
  discordMeta: null,
  isLoading: false,
  isAuthenticated: false,
  isNewUser: false,
  setUser: vi.fn(),
  clearUser: vi.fn(),
}));
vi.mock('@/context', () => ({
  useAuth: () => mockUseAuth(),
}));

// useDiscordAuth をモック
vi.mock('@/hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({ login: vi.fn() }),
}));

// ScenarioRegisterDialog をモック（Portal 回避）
vi.mock('@/components/blocks/ScenarioRegisterDialog', () => ({
  ScenarioRegisterDialog: ({ children }: { children: React.ReactNode }) =>
    children,
}));

const loggedInAuth: AuthContextType = {
  user: {
    userId: 'u_1',
    discordId: 'd_1',
    nickname: 'はるか',
    avatar: null,
    role: 'MEMBER',
  },
  discordMeta: null,
  isLoading: false,
  isAuthenticated: true,
  isNewUser: false,
  setUser: vi.fn(),
  clearUser: vi.fn(),
};

describe('SideMenu', () => {
  describe('レンダリング', () => {
    it('ロゴがホームへのリンクになっている', () => {
      render(<SideMenu />);
      expect(
        screen.getByRole('link', { name: /シナプレ管理くん/i }),
      ).toHaveAttribute('href', '/home');
    });

    it('主要ナビが正しい href を持つ', () => {
      render(<SideMenu />);
      const expected: [string, string][] = [
        ['ホーム', '/home'],
        ['シナリオ', '/scenarios'],
        ['セッション', '/sessions'],
        ['スケジュール', '/schedules'],
        ['ユーザー', '/users'],
      ];
      for (const [name, href] of expected) {
        expect(screen.getByRole('link', { name })).toHaveAttribute(
          'href',
          href,
        );
      }
    });

    it('nav 要素が使用されている', () => {
      render(<SideMenu />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('アクティブ状態', () => {
    it('現在パスのリンクに aria-current=page が付く', () => {
      mockPathname.mockReturnValue('/scenarios');
      render(<SideMenu />);
      expect(screen.getByRole('link', { name: 'シナリオ' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('link', { name: 'ホーム' })).not.toHaveAttribute(
        'aria-current',
      );
    });
  });

  describe('未ログイン時', () => {
    it('ログインボタンが表示される', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        discordMeta: null,
        isLoading: false,
        isAuthenticated: false,
        isNewUser: false,
        setUser: vi.fn(),
        clearUser: vi.fn(),
      });
      render(<SideMenu />);
      expect(
        screen.getByRole('button', { name: /ログイン/i }),
      ).toBeInTheDocument();
    });
  });

  describe('ログイン時', () => {
    it('シナリオ登録ボタンとユーザー名が表示される', () => {
      mockUseAuth.mockReturnValue(loggedInAuth);
      render(<SideMenu />);
      expect(
        screen.getByRole('button', { name: /シナリオを登録/i }),
      ).toBeInTheDocument();
      expect(screen.getByText('はるか')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /はるか/i })).toHaveAttribute(
        'href',
        '/profile',
      );
    });
  });
});
