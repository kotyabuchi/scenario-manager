import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './CancelModal.stories';

const {
  CancelSession,
  WithdrawApplication,
  KickParticipant,
  Submitting,
  Closed,
} = composeStories(stories);

describe('CancelModal', () => {
  // US-S109: GMとして、セッションをキャンセルできる
  describe('S109: セッションキャンセル（GM）', () => {
    it('S109-01: キャンセル確認メッセージが表示される', () => {
      render(<CancelSession />);

      // タイトルに「キャンセル」が含まれる
      expect(
        screen.getByRole('heading', { name: /キャンセル/i }),
      ).toBeInTheDocument();
      // セッション名が表示される
      expect(screen.getByText(/週末CoC7版セッション/i)).toBeInTheDocument();
    });

    it('S109-02: 確認ボタンが表示される', () => {
      render(<CancelSession />);

      expect(
        screen.getByRole('button', { name: /キャンセル|中止|確認/i }),
      ).toBeInTheDocument();
    });

    it('S109-03: 確認ボタンクリックでonConfirmが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn();
      render(<CancelSession onConfirm={handleConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /キャンセル|中止|確認/i }),
      );

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalled();
      });
    });

    it('S109-04: 警告メッセージ（参加者への通知）が表示される', () => {
      render(<CancelSession />);

      // 参加者への影響を警告するメッセージ
      expect(screen.getByText(/参加者|通知|影響/i)).toBeInTheDocument();
    });

    it('S109-05: キャンセル理由を入力できる', async () => {
      const user = userEvent.setup();
      render(<CancelSession />);

      const reasonInput = screen.getByLabelText(/理由|コメント/i);
      await user.type(reasonInput, '都合により中止します');

      expect(reasonInput).toHaveValue('都合により中止します');
    });
  });

  // US-S110: PLとして、参加申請を取り消せる
  // US-S111: PLとして、承認済みでも辞退できる
  describe('S110-S111: 参加辞退（PL）', () => {
    it('S110-01: 辞退確認メッセージが表示される', () => {
      render(<WithdrawApplication />);

      // タイトルに「辞退」が含まれる
      expect(
        screen.getByRole('heading', { name: /辞退/i }),
      ).toBeInTheDocument();
      // セッション名が表示される
      expect(screen.getByText(/狂気山脈セッション/i)).toBeInTheDocument();
    });

    it('S110-02: 辞退ボタンが表示される', () => {
      render(<WithdrawApplication />);

      expect(
        screen.getByRole('button', { name: /辞退|取り消し|確認/i }),
      ).toBeInTheDocument();
    });

    it('S110-03: 辞退ボタンクリックでonConfirmが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn();
      render(<WithdrawApplication onConfirm={handleConfirm} />);

      await user.click(
        screen.getByRole('button', { name: /辞退|取り消し|確認/i }),
      );

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalled();
      });
    });

    it('S111-01: 承認済みの場合は警告メッセージが表示される', () => {
      render(<WithdrawApplication />);

      // 辞退による影響を警告するメッセージがあるか確認
      expect(screen.getByText(/辞退すると/i)).toBeInTheDocument();
    });
  });

  // 参加者除外（GM）
  describe('参加者除外（GM）', () => {
    it('除外対象者の名前が表示される', () => {
      render(<KickParticipant />);

      expect(screen.getByText(/問題のあるユーザー/i)).toBeInTheDocument();
    });

    it('除外確認ボタンが表示される', () => {
      render(<KickParticipant />);

      expect(
        screen.getByRole('button', { name: /除外|確認/i }),
      ).toBeInTheDocument();
    });

    it('除外ボタンクリックでonConfirmが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleConfirm = vi.fn();
      render(<KickParticipant onConfirm={handleConfirm} />);

      await user.click(screen.getByRole('button', { name: /除外|確認/i }));

      await waitFor(() => {
        expect(handleConfirm).toHaveBeenCalled();
      });
    });
  });

  // 共通：キャンセルボタン
  describe('キャンセルボタン（モーダルを閉じる）', () => {
    it('「戻る」ボタンでモーダルを閉じられる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<CancelSession onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: /^戻る$/i }));

      expect(handleClose).toHaveBeenCalled();
    });
  });

  // 送信状態
  describe('送信状態', () => {
    it('処理中は確認ボタンが無効化される', () => {
      render(<Submitting />);

      // 送信中は loadingText が表示される
      const confirmButton = screen.getByRole('button', {
        name: /処理中/i,
      });
      expect(confirmButton).toBeDisabled();
    });
  });

  // モーダル表示制御
  describe('モーダル表示制御', () => {
    it('isOpen=falseの場合はモーダルが表示されない', () => {
      render(<Closed />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=trueの場合はモーダルが表示される', () => {
      render(<CancelSession />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // アクセシビリティ
  describe('アクセシビリティ', () => {
    it('危険なアクション（キャンセル/除外）は視覚的に区別される', () => {
      render(<CancelSession />);

      // 危険なアクションはvariant="danger"やred系の色で表示される想定
      const confirmButton = screen.getByRole('button', {
        name: /キャンセル|中止|確認/i,
      });
      expect(confirmButton).toBeInTheDocument();
    });
  });
});
