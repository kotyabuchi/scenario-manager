import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './SessionForm.stories';

const { Default, Filled, WithErrors, Submitting } = composeStories(stories);

describe('SessionForm', () => {
  // US-S101: GMとして、シナリオ未定でもセッションを募集できる
  describe('S101: シナリオ未定での募集', () => {
    it('S101-01: シナリオ未選択でフォームが表示される', () => {
      render(<Default />);

      // シナリオ選択が「未定」または空の状態で表示されること
      expect(screen.getByLabelText(/シナリオ/i)).toBeInTheDocument();
    });

    it('S101-02: シナリオを選択できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      // シナリオ選択ドロップダウンを操作
      const scenarioSelect = screen.getByLabelText(/シナリオ/i);
      await user.click(scenarioSelect);

      // 選択肢が表示されることを確認（実装後に具体的な選択肢をテスト）
      expect(scenarioSelect).toBeInTheDocument();
    });
  });

  // US-S102: GMとして、日程未定でもセッションを募集できる
  describe('S102: 日程未定での募集', () => {
    it('S102-01: 日程未選択でフォームが送信できる', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<Default onSubmit={handleSubmit} />);

      // 必須項目のみ入力
      await user.type(
        screen.getByLabelText(/セッション名/i),
        'テストセッション',
      );
      await user.type(screen.getByLabelText(/募集文/i), 'テスト説明');

      // 送信
      await user.click(screen.getByRole('button', { name: /募集を投稿/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it('S102-02: 日程を指定できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      // 日程入力フィールドを確認
      const dateInput = screen.getByLabelText(/日時/i);
      expect(dateInput).toBeInTheDocument();

      // 日付を入力
      await user.type(dateInput, '2026-02-01T20:00');
      expect(dateInput).toHaveValue('2026-02-01T20:00');
    });
  });

  // US-S103: GMとして、人数未定でもセッションを募集できる
  describe('S103: 人数未定での募集', () => {
    it('S103-01: 人数未指定でフォームが送信できる', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<Default onSubmit={handleSubmit} />);

      // 必須項目のみ入力（人数なし）
      await user.type(
        screen.getByLabelText(/セッション名/i),
        'テストセッション',
      );
      await user.type(screen.getByLabelText(/募集文/i), 'テスト説明');

      // 送信
      await user.click(screen.getByRole('button', { name: /募集を投稿/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it('S103-02: 人数を指定できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      // 人数入力フィールドを確認
      const playerCountInput = screen.getByLabelText(/募集人数/i);
      expect(playerCountInput).toBeInTheDocument();

      // 人数を入力
      await user.clear(playerCountInput);
      await user.type(playerCountInput, '4');
      expect(playerCountInput).toHaveValue(4);
    });
  });

  // フォームUI テスト
  describe('FORM: フォームUI', () => {
    it('FORM-01: 募集文（必須）を入力できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      const descriptionInput = screen.getByLabelText(/募集文/i);
      await user.type(descriptionInput, 'テスト募集文です');

      expect(descriptionInput).toHaveValue('テスト募集文です');
    });

    it('FORM-02: セッション名（必須）を入力できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      const nameInput = screen.getByLabelText(/セッション名/i);
      await user.type(nameInput, 'テストセッション');

      expect(nameInput).toHaveValue('テストセッション');
    });

    it('FORM-03: 使用ツールを入力できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      const toolsInput = screen.getByLabelText(/使用ツール/i);
      await user.type(toolsInput, 'Discord + ココフォリア');

      expect(toolsInput).toHaveValue('Discord + ココフォリア');
    });

    it('FORM-04: 初心者歓迎チェックボックスを操作できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      const checkbox = screen.getByLabelText(/初心者歓迎/i);
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('FORM-05: 公開範囲を選択できる', async () => {
      const user = userEvent.setup();
      render(<Default />);

      // 全体公開がデフォルトで選択されている
      const publicRadio = screen.getByLabelText(/全体公開/i);
      expect(publicRadio).toBeChecked();

      // フォロワーのみに変更
      const followersRadio = screen.getByLabelText(/フォロワーのみ/i);
      await user.click(followersRadio);
      expect(followersRadio).toBeChecked();
      expect(publicRadio).not.toBeChecked();
    });

    it('FORM-06: 送信ボタンクリックでフォーム送信', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<Filled onSubmit={handleSubmit} />);

      await user.click(screen.getByRole('button', { name: /募集を投稿/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it('FORM-07: バリデーションエラー時にエラー表示', () => {
      render(<WithErrors />);

      expect(screen.getByText('セッション名は必須です')).toBeInTheDocument();
      expect(screen.getByText('募集文は必須です')).toBeInTheDocument();
    });

    it('送信中は送信ボタンが無効化される', () => {
      render(<Submitting />);

      // 送信中は loadingText が表示される
      const submitButton = screen.getByRole('button', { name: /投稿中/i });
      expect(submitButton).toBeDisabled();
    });
  });

  // 全項目入力テスト
  describe('統合テスト', () => {
    it('全項目を入力して送信できる', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<Default onSubmit={handleSubmit} />);

      // 必須項目
      await user.type(
        screen.getByLabelText(/セッション名/i),
        'テストセッション',
      );
      await user.type(screen.getByLabelText(/募集文/i), 'テスト募集文です');

      // オプション項目
      await user.type(screen.getByLabelText(/募集人数/i), '4');
      await user.type(screen.getByLabelText(/使用ツール/i), 'Discord');
      await user.click(screen.getByLabelText(/初心者歓迎/i));

      // 送信
      await user.click(screen.getByRole('button', { name: /募集を投稿/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionName: 'テストセッション',
            sessionDescription: 'テスト募集文です',
            recruitedPlayerCount: 4,
            tools: 'Discord',
            isBeginnerFriendly: true,
          }),
        );
      });
    });
  });
});
