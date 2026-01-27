import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './GlobalHeader.stories';

const { Default, HomePage, ScenariosPage, SessionsPage, UsersPage } =
  composeStories(stories);

describe('GlobalHeader', () => {
  describe('レンダリング', () => {
    // GHD-01: ロゴが正しく表示される
    it('ロゴが表示される', () => {
      render(<Default />);

      expect(screen.getByText('シナプレ管理くん')).toBeInTheDocument();
    });

    // GHD-02: ナビゲーションリンクが表示される
    it('ナビゲーションリンクが表示される', () => {
      render(<Default />);

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

    // GHD-03: ロゴがホームへのリンクになっている
    it('ロゴがホームへのリンクになっている', () => {
      render(<Default />);

      const logoLink = screen.getByRole('link', { name: /シナプレ管理くん/i });
      expect(logoLink).toHaveAttribute('href', '/home');
    });
  });

  describe('未ログイン時', () => {
    // GHD-04: ログインボタンが表示される
    it('ログインボタンが表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: /ログイン/i }),
      ).toBeInTheDocument();
    });

    // GHD-05: 新規登録ボタンが表示される
    it('新規登録ボタンが表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: /新規登録/i }),
      ).toBeInTheDocument();
    });
  });

  describe('ナビゲーション', () => {
    // GHD-06: 各リンクが正しいhrefを持つ
    it('各リンクが正しいhrefを持つ', () => {
      render(<Default />);

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
    // GHD-07: シナリオ画面で登録ボタンが表示される
    it('シナリオ画面で登録ボタンが表示される', () => {
      render(<ScenariosPage />);

      expect(
        screen.getByRole('link', { name: /シナリオを登録/i }),
      ).toBeInTheDocument();
    });

    // GHD-08: シナリオ登録ボタンが正しいリンク先を持つ
    it('シナリオ登録ボタンが正しいリンク先を持つ', () => {
      render(<ScenariosPage />);

      const registerLink = screen.getByRole('link', {
        name: /シナリオを登録/i,
      });
      expect(registerLink).toHaveAttribute('href', '/scenarios/new');
    });
  });

  describe('アクセシビリティ', () => {
    // GHD-09: header要素が使用されている
    it('header要素が使用されている', () => {
      render(<Default />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // GHD-10: nav要素が使用されている
    it('nav要素が使用されている', () => {
      render(<Default />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('各ページでのアクティブ状態', () => {
    // GHD-11: ホーム画面でホームリンクがアクティブ
    it('ホーム画面でレンダリングできる', () => {
      render(<HomePage />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // GHD-12: セッション画面でレンダリングできる
    it('セッション画面でレンダリングできる', () => {
      render(<SessionsPage />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    // GHD-13: ユーザー画面でレンダリングできる
    it('ユーザー画面でレンダリングできる', () => {
      render(<UsersPage />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});
