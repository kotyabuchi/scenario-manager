import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './ApprovalModal.stories';

const { Default, WithoutMessage, LongMessage, Approving, Closed } =
  composeStories(stories);

describe('ApprovalModal', () => {
  // US-S106: GMとして、申請一覧を確認できる
  // US-S107: GMとして、申請を承認・却下できる
  describe('S106-S107: 申請者情報の表示と承認・却下', () => {
    it('S106-01: 申請者の名前が表示される', () => {
      render(<Default />);

      expect(screen.getByText(/山田花子/i)).toBeInTheDocument();
    });

    it('S106-02: 申請者のメッセージが表示される', () => {
      render(<Default />);

      expect(
        screen.getByText(/初心者ですがよろしくお願いします/i),
      ).toBeInTheDocument();
    });

    it('S106-03: メッセージがない場合は適切に表示される', () => {
      render(<WithoutMessage />);

      // メッセージなしの表示（「メッセージなし」または空欄）
      expect(screen.getByText(/佐藤次郎/i)).toBeInTheDocument();
      // メッセージ欄が空または「なし」表示
      expect(
        screen.queryByText(/初心者ですが/) ||
          screen.getByText(/メッセージなし|コメントなし/i),
      ).toBeTruthy();
    });

    it('S106-04: 申請日時が表示される', () => {
      render(<Default />);

      // 日時のフォーマットは実装依存だが、何らかの形で表示される
      expect(
        screen.getByText(/2026/) ||
          screen.getByText(/1月/) ||
          screen.getByText(/15:30/),
      ).toBeTruthy();
    });

    it('S107-01: 承認ボタンが表示される', () => {
      render(<Default />);

      expect(screen.getByRole('button', { name: /承認/i })).toBeInTheDocument();
    });

    it('S107-02: 却下ボタンが表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: /却下|拒否/i }),
      ).toBeInTheDocument();
    });

    it('S107-03: 承認ボタンクリックでonApproveが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleApprove = vi.fn();
      render(<Default onApprove={handleApprove} />);

      await user.click(screen.getByRole('button', { name: /承認/i }));

      await waitFor(() => {
        expect(handleApprove).toHaveBeenCalled();
      });
    });

    it('S107-04: 却下ボタンクリックでonRejectが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleReject = vi.fn();
      render(<Default onReject={handleReject} />);

      await user.click(screen.getByRole('button', { name: /却下|拒否/i }));

      await waitFor(() => {
        expect(handleReject).toHaveBeenCalled();
      });
    });
  });

  // US-S108: GMとして、承認時にメッセージを送れる
  describe('S108: 承認時メッセージ', () => {
    it('S108-01: 承認時メッセージ入力欄が表示される', () => {
      render(<Default />);

      // 承認メッセージ入力欄（任意）
      const messageInput = screen.queryByLabelText(/メッセージ|コメント/i);
      expect(messageInput).toBeInTheDocument();
    });

    it('S108-02: メッセージを入力して承認できる', async () => {
      const user = userEvent.setup();
      const handleApprove = vi.fn();
      render(<Default onApprove={handleApprove} />);

      const messageInput = screen.getByLabelText(/メッセージ|コメント/i);
      await user.type(messageInput, '承認しました。当日よろしくお願いします！');

      await user.click(screen.getByRole('button', { name: /承認/i }));

      await waitFor(() => {
        expect(handleApprove).toHaveBeenCalledWith(
          expect.objectContaining({
            message: '承認しました。当日よろしくお願いします！',
          }),
        );
      });
    });
  });

  // 長いメッセージの表示
  describe('長いメッセージ', () => {
    it('長いメッセージが適切に表示される', () => {
      render(<LongMessage />);

      expect(
        screen.getByText(/TRPGは1年ほどプレイしています/i),
      ).toBeInTheDocument();
    });
  });

  // 送信状態
  describe('送信状態', () => {
    it('処理中は承認・却下ボタンが無効化される', () => {
      render(<Approving />);

      // 送信中は loadingText が表示される
      expect(screen.getByRole('button', { name: /処理中/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /却下|拒否/i })).toBeDisabled();
    });
  });

  // モーダル表示制御
  describe('モーダル表示制御', () => {
    it('isOpen=falseの場合はモーダルが表示されない', () => {
      render(<Closed />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=trueの場合はモーダルが表示される', () => {
      render(<Default />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('閉じるボタンでonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<Default onClose={handleClose} />);

      await user.click(
        screen.getByRole('button', { name: /閉じる|キャンセル|×/i }),
      );

      expect(handleClose).toHaveBeenCalled();
    });
  });
});
