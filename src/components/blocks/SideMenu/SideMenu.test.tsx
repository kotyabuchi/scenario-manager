import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
const mockLogin = vi.fn();
vi.mock('@/hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({ login: mockLogin }),
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
  beforeEach(() => {
    mockPathname.mockReturnValue('/home');
    mockLogin.mockClear();
    mockUseAuth.mockReturnValue({
      user: null,
      discordMeta: null,
      isLoading: false,
      isAuthenticated: false,
      isNewUser: false,
      setUser: vi.fn(),
      clearUser: vi.fn(),
    });
  });

  describe('レンダリング', () => {
    it('閉じるとリンクをアイコンだけにし、サービス情報を隠して再び開ける', async () => {
      const user = userEvent.setup();
      render(<SideMenu />);

      await user.click(
        screen.getByRole('button', { name: 'サイドメニューを閉じる' }),
      );
      const home = screen.getByRole('link', { name: 'ホーム' });
      expect(home).toHaveAttribute('href', '/home');
      expect(home).not.toHaveTextContent('ホーム');
      expect(home.querySelector('svg')).not.toBeNull();
      const logo = screen.getByRole('link', { name: 'シナプレ管理くん' });
      expect(logo).toHaveAttribute('href', '/home');
      expect(logo.querySelector('svg')).not.toBeNull();
      expect(screen.getByRole('link', { name: 'シナリオ' })).toHaveAttribute(
        'href',
        '/scenarios',
      );
      expect(
        screen.queryByRole('link', { name: 'サービスについて' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeVisible();
      await user.click(
        screen.getByRole('button', { name: 'サイドメニューを開く' }),
      );
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'ホーム' })).toHaveTextContent(
        'ホーム',
      );
      expect(
        screen.getByRole('link', { name: 'サービスについて' }),
      ).toBeVisible();
    });

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
    it('詳細ルートでも親のシナリオだけが現在地になる', () => {
      mockPathname.mockReturnValue('/scenarios/scenario-1');
      render(<SideMenu />);
      expect(screen.getByRole('link', { current: 'page' })).toHaveTextContent(
        'シナリオ',
      );
    });

    it('パスの先頭が似ている別ルートを現在地にしない', () => {
      mockPathname.mockReturnValue('/scenarios-archive');
      render(<SideMenu />);
      expect(screen.queryByRole('link', { current: 'page' })).toBeNull();
    });

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
    it('キーボードでログインを開始でき、登録導線は表示しない', async () => {
      const user = userEvent.setup();
      render(<SideMenu />);
      screen.getByRole('button', { name: 'ログイン' }).focus();
      await user.keyboard('{Enter}');
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(
        screen.queryByRole('button', { name: /シナリオを登録/ }),
      ).not.toBeInTheDocument();
    });

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
    it('認証状態が変わるとログイン導線からプロフィール導線に切り替わる', () => {
      const { rerender } = render(<SideMenu />);
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeVisible();
      mockUseAuth.mockReturnValue(loggedInAuth);
      rerender(<SideMenu />);
      expect(screen.queryByRole('button', { name: 'ログイン' })).toBeNull();
      expect(
        screen.getByRole('link', { name: 'プロフィール: はるか' }),
      ).toHaveAttribute('href', '/profile');
    });

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
