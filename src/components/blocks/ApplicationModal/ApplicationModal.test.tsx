import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './ApplicationModal.stories';

const { Default, ScenarioUndecided, ScheduleUndecided, Submitting, Closed } =
  composeStories(stories);

describe('ApplicationModal', () => {
  // US-S104: PLとして、参加申請フォームから申請できる
  describe('S104: 参加申請', () => {
    it('S104-01: モーダルが開いた状態でセッション情報が表示される', () => {
      render(<Default />);

      expect(screen.getByText(/週末CoC7版セッション/i)).toBeInTheDocument();
      expect(screen.getByText(/田中太郎/i)).toBeInTheDocument();
      expect(screen.getByText(/狂気山脈/i)).toBeInTheDocument();
    });

    it('S104-02: シナリオ未定の場合は「未定」と表示される', () => {
      render(<ScenarioUndecided />);

      expect(screen.getByText(/未定/i)).toBeInTheDocument();
    });

    it('S104-03: 日程未定の場合は「未定」と表示される', () => {
      render(<ScheduleUndecided />);

      // 日程が未定の場合の表示を確認
      expect(
        screen.getByText(/未定/i).closest('[data-testid="schedule"]') ||
          screen.getByText(/日程未定/i),
      ).toBeInTheDocument();
    });

    it('S104-04: 申請ボタンをクリックするとonSubmitが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<Default onSubmit={handleSubmit} />);

      // コメント入力（任意）
      const commentInput = screen.queryByLabelText(/コメント|メッセージ/i);
      if (commentInput) {
        await user.type(commentInput, 'よろしくお願いします');
      }

      // 申請ボタンをクリック
      await user.click(screen.getByRole('button', { name: /申請|参加/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it('S104-05: キャンセルボタンでモーダルが閉じる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<Default onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: /^キャンセル$/i }));

      expect(handleClose).toHaveBeenCalled();
    });
  });

  // US-S105: PLとして、申請時にGMへメッセージを添えられる
  describe('S105: 申請メッセージ', () => {
    it('S105-01: メッセージ入力欄が表示される', () => {
      render(<Default />);

      expect(screen.getByLabelText(/コメント|メッセージ/i)).toBeInTheDocument();
    });

    it('S105-02: メッセージを入力できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      const messageInput = screen.getByLabelText(/コメント|メッセージ/i);
      await user.type(messageInput, '初心者ですがよろしくお願いします');

      expect(messageInput).toHaveValue('初心者ですがよろしくお願いします');
    });

    it('S105-03: メッセージは任意（空でも申請可能）', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<Default onSubmit={handleSubmit} />);

      // メッセージを入力せずに申請
      await user.click(screen.getByRole('button', { name: /申請|参加/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });

  // 送信状態のテスト
  describe('送信状態', () => {
    it('送信中は申請ボタンが無効化される', () => {
      render(<Submitting />);

      // 送信中は loadingText が表示される
      const submitButton = screen.getByRole('button', { name: /送信中/i });
      expect(submitButton).toBeDisabled();
    });

    it('送信中はローディング表示がある', () => {
      render(<Submitting />);

      // ローディングテキストの確認
      expect(screen.getByText(/送信中/i)).toBeInTheDocument();
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
  });

  // アクセシビリティ
  describe('アクセシビリティ', () => {
    it('モーダルにはrole="dialog"が設定されている', () => {
      render(<Default />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('モーダルにはaria-labelまたはaria-labelledbyが設定されている', () => {
      render(<Default />);

      const dialog = screen.getByRole('dialog');
      expect(
        dialog.hasAttribute('aria-label') ||
          dialog.hasAttribute('aria-labelledby'),
      ).toBe(true);
    });
  });
});
