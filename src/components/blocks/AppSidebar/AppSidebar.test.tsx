import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppSidebar } from './AppSidebar';

import type { AuthContextType } from '@/context/auth-context';

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

afterEach(() => {
  mockUseAuth.mockImplementation(unauthenticatedUser);
  mockPathname.mockReturnValue('/scenarios');
  mockLogin.mockClear();
});

vi.mock('@/context', () => ({
  useAuth: () => mockUseAuth(),
}));

// useDiscordAuth をモック
const mockLogin = vi.fn();
vi.mock('@/hooks/useDiscordAuth', () => ({
  useDiscordAuth: () => ({
    login: mockLogin,
  }),
}));

// ScenarioRegisterDialog をモック（Portalを使うため）
vi.mock('@/components/blocks/ScenarioRegisterDialog', () => ({
  ScenarioRegisterDialog: ({ children }: { children: React.ReactNode }) =>
    children,
}));

const authenticatedUser = {
  user: {
    userId: 'test-user',
    discordId: 'discord-123',
    nickname: 'テストユーザー',
    avatar: null,
    role: 'MEMBER',
  },
  discordMeta: null,
  isLoading: false,
  isAuthenticated: true,
  isNewUser: false,
  setUser: vi.fn(),
  clearUser: vi.fn(),
} satisfies AuthContextType;

// jotai のデフォルトストアがテスト間で共有されないよう Provider で分離する
const renderSidebar = () =>
  render(
    <Provider>
      <AppSidebar />
    </Provider>,
  );

describe('AppSidebar', () => {
  describe('ナビゲーション', () => {
    it('ナビ5項目が表示される', () => {
      renderSidebar();
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

    it('各リンクが正しいhrefを持つ', () => {
      renderSidebar();
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

    it('アクティブなナビ項目に aria-current="page" が付与される', () => {
      mockPathname.mockReturnValue('/scenarios');
      renderSidebar();
      expect(screen.getByRole('link', { name: 'シナリオ' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getByRole('link', { name: 'ホーム' })).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('配下のパスでもアクティブ判定される', () => {
      mockPathname.mockReturnValue('/sessions/01ABC');
      renderSidebar();
      expect(screen.getByRole('link', { name: 'セッション' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('ロゴがホームへのリンクになっている', () => {
      renderSidebar();
      const logoLink = screen.getByRole('link', { name: /シナプレ管理くん/i });
      expect(logoLink).toHaveAttribute('href', '/home');
    });
  });

  describe('未ログイン時', () => {
    it('ログインボタンが表示される', () => {
      renderSidebar();
      expect(
        screen.getByRole('button', { name: 'ログイン' }),
      ).toBeInTheDocument();
    });

    it('シナリオ登録ボタンは表示されない', () => {
      renderSidebar();
      expect(
        screen.queryByRole('button', { name: 'シナリオを登録' }),
      ).not.toBeInTheDocument();
    });

    it('ログインボタンクリックでloginが呼ばれる', async () => {
      const user = userEvent.setup();
      renderSidebar();
      await user.click(screen.getByRole('button', { name: 'ログイン' }));
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  describe('ログイン時', () => {
    it('シナリオ登録ボタンが表示される', () => {
      mockUseAuth.mockReturnValue(authenticatedUser);
      renderSidebar();
      expect(
        screen.getByRole('button', { name: 'シナリオを登録' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'ログイン' }),
      ).not.toBeInTheDocument();
    });

    it('ユーザーメニュー（アバター+ニックネーム）が表示される', () => {
      mockUseAuth.mockReturnValue(authenticatedUser);
      renderSidebar();
      expect(
        screen.getByRole('button', { name: 'ユーザーメニュー' }),
      ).toBeInTheDocument();
      expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    });
  });

  describe('折りたたみトグル', () => {
    it('初期状態は data-collapsed="auto"', () => {
      renderSidebar();
      expect(screen.getByRole('complementary')).toHaveAttribute(
        'data-collapsed',
        'auto',
      );
    });

    it('トグルクリックで折りたたみ状態が切り替わる', async () => {
      const user = userEvent.setup();
      renderSidebar();
      const aside = screen.getByRole('complementary');
      const toggle = screen.getByRole('button', { name: 'サイドバーを開閉' });

      // jsdomのmatchMediaモックはmatches:false（lg未満扱い）
      // → auto時の実効状態は「折りたたみ」なので、1回目のクリックで展開される
      await user.click(toggle);
      expect(aside).toHaveAttribute('data-collapsed', 'false');

      await user.click(toggle);
      expect(aside).toHaveAttribute('data-collapsed', 'true');

      await user.click(toggle);
      expect(aside).toHaveAttribute('data-collapsed', 'false');
    });
  });

  describe('アクセシビリティ', () => {
    it('aside要素が使用されている', () => {
      renderSidebar();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('nav要素にラベルが付与されている', () => {
      renderSidebar();
      expect(
        screen.getByRole('navigation', { name: 'メインナビゲーション' }),
      ).toBeInTheDocument();
    });
  });
});
