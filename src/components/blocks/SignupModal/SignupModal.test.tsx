import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import * as stories from './SignupModal.stories';

const {
  Step1Default,
  Step1WithErrors,
  Step1Checking,
  Step1Available,
  Step1Taken,
  Step2Default,
  Step2Filled,
  Submitting,
  Closed,
  Completion,
} = composeStories(stories);

describe('SignupModal', () => {
  // US-A04: 初回ログインユーザーとして、プロフィール設定ができる
  describe('A04: Step 1 基本情報入力', () => {
    it('A04-01: モーダルが開いた状態でStep1フォームが表示される', () => {
      render(<Step1Default />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/ユーザーID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/表示名/i)).toBeInTheDocument();
    });

    it('A04-02: Discord名からユーザーIDがデフォルト入力される', () => {
      render(<Step1Default />);

      expect(screen.getByLabelText(/ユーザーID/i)).toHaveValue('taro_trpg');
    });

    it('A04-03: Discord名から表示名がデフォルト入力される', () => {
      render(<Step1Default />);

      expect(screen.getByLabelText(/表示名/i)).toHaveValue('太郎');
    });

    it('A04-04: Discordアバターが表示される', () => {
      render(<Step1Default />);

      const avatar = screen.getByRole('img', { name: /アバター/i });
      expect(avatar).toBeInTheDocument();
    });

    it('A04-05: ステップインジケーターが表示される', () => {
      render(<Step1Default />);

      expect(screen.getByText(/ステップ.*1/i)).toBeInTheDocument();
    });

    it('A04-12: ユーザーIDにプレースホルダーが表示される', () => {
      render(<Step1WithErrors />);

      expect(screen.getByLabelText(/ユーザーID/i)).toHaveAttribute(
        'placeholder',
        '例: taro_trpg',
      );
    });

    it('A04-13: 表示名にプレースホルダーが表示される', () => {
      render(<Step1WithErrors />);

      expect(screen.getByLabelText(/表示名/i)).toHaveAttribute(
        'placeholder',
        '例: 太郎',
      );
    });

    it('A04-14: ユーザーIDに文字数制限ヒントが表示される', () => {
      render(<Step1Default />);

      expect(screen.getByText(/3〜20文字/)).toBeInTheDocument();
    });

    it('A04-06: 「次へ」ボタンが表示される', () => {
      render(<Step1Default />);

      expect(screen.getByRole('button', { name: /次へ/i })).toBeInTheDocument();
    });

    it('A04-07: 有効な入力で「次へ」をクリックするとStep2に遷移する', async () => {
      const user = userEvent.setup();
      render(<Step1Default />);

      await user.click(screen.getByRole('button', { name: /次へ/i }));

      await waitFor(() => {
        // Step2のUI要素が表示される
        expect(screen.getByLabelText(/自己紹介/i)).toBeInTheDocument();
      });
    });
  });

  // バリデーションエラー表示
  describe('A04: Step 1 バリデーション表示', () => {
    it('A04-08: 空のフォームで「次へ」を押すとエラーが表示される', async () => {
      const user = userEvent.setup();
      render(<Step1WithErrors />);

      await user.click(screen.getByRole('button', { name: /次へ/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/ユーザーIDを入力してください/i),
        ).toBeInTheDocument();
      });
    });
  });

  // ユーザーID一意性チェック表示
  describe('A04: ユーザーID一意性チェック', () => {
    it('A04-09: チェック中にローディングインジケーターが表示される', () => {
      render(<Step1Checking />);

      expect(
        screen.getByTestId('username-checking') || screen.getByText(/確認中/i),
      ).toBeInTheDocument();
    });

    it('A04-10: ユーザーIDが使用可能な場合、チェックマークが表示される', () => {
      render(<Step1Available />);

      expect(
        screen.getByTestId('username-available') ||
          screen.getByText(/使用可能/i),
      ).toBeInTheDocument();
    });

    it('A04-11: ユーザーIDが使用済みの場合、エラーメッセージが表示される', () => {
      render(<Step1Taken />);

      expect(screen.getByText(/既に使用されています/i)).toBeInTheDocument();
    });
  });

  // US-A05: Step 2 追加情報
  describe('A05: Step 2 追加情報入力', () => {
    it('A05-01: Step2で自己紹介入力欄が表示される', () => {
      render(<Step2Default />);

      expect(screen.getByLabelText(/自己紹介/i)).toBeInTheDocument();
    });

    it('A05-02: Step2で好きなシステムのチップ選択が表示される', () => {
      render(<Step2Default />);

      expect(screen.getByText(/好きなシステム/i)).toBeInTheDocument();
    });

    it('A05-03: Step2で好きなシナリオ入力欄が表示される', () => {
      render(<Step2Default />);

      expect(screen.getByLabelText(/好きなシナリオ/i)).toBeInTheDocument();
    });

    it('A05-09: 自己紹介にプレースホルダーが表示される', () => {
      render(<Step2Default />);

      expect(screen.getByLabelText(/自己紹介/i)).toHaveAttribute(
        'placeholder',
        '例: TRPGが大好きです。CoC7版をメインに遊んでいます。',
      );
    });

    it('A05-10: 好きなシナリオにプレースホルダーが表示される', () => {
      render(<Step2Default />);

      expect(screen.getByLabelText(/好きなシナリオ/i)).toHaveAttribute(
        'placeholder',
        '例: 狂気山脈、悪霊の家',
      );
    });

    it('A05-11: 自己紹介に文字数カウンターが表示される', () => {
      render(<Step2Default />);

      // charCounter spanを検索
      const counters = screen.getAllByText(/^0\/500$/);
      expect(counters.length).toBeGreaterThanOrEqual(1);
    });

    it('A05-12: 好きなシナリオに文字数カウンターが表示される', () => {
      render(<Step2Default />);

      // 2つのカウンターが存在する（自己紹介と好きなシナリオ）
      const counters = screen.getAllByText(/^0\/500$/);
      expect(counters.length).toBeGreaterThanOrEqual(2);
    });

    it('A05-13: 入力済み状態で文字数カウンターが更新される', () => {
      render(<Step2Filled />);

      // 「TRPGが大好きです。CoC7版をメインに遊んでいます。」= 28文字
      expect(screen.getByText('28/500')).toBeInTheDocument();
    });

    it('A05-14: ラベルに文字数制限ヒントが含まれる', () => {
      render(<Step2Default />);

      // FormFieldのlabelに「（500文字以内）」が含まれている
      expect(screen.getByText(/自己紹介（500文字以内）/)).toBeInTheDocument();
    });

    it('A05-04: 「スキップ」ボタンが表示される', () => {
      render(<Step2Default />);

      expect(
        screen.getByRole('button', { name: /スキップ/i }),
      ).toBeInTheDocument();
    });

    it('A05-05: 「登録する」ボタンが表示される', () => {
      render(<Step2Default />);

      expect(
        screen.getByRole('button', { name: /登録する/i }),
      ).toBeInTheDocument();
    });

    it('A05-06: 「スキップ」をクリックすると完了画面に遷移する', async () => {
      const user = userEvent.setup();
      render(<Step2Default />);

      await user.click(screen.getByRole('button', { name: /スキップ/i }));

      await waitFor(() => {
        expect(screen.getByText(/登録が完了しました/)).toBeInTheDocument();
      });
    });

    it('A05-07: Step2で「戻る」ボタンが表示される', () => {
      render(<Step2Default />);

      expect(screen.getByRole('button', { name: /戻る/i })).toBeInTheDocument();
    });

    it('A05-08: 入力済み状態で各フィールドに値が表示される', () => {
      render(<Step2Filled />);

      expect(screen.getByLabelText(/自己紹介/i)).toHaveValue(
        'TRPGが大好きです。CoC7版をメインに遊んでいます。',
      );
    });
  });

  // 送信状態
  describe('送信状態', () => {
    it('送信中は「登録する」ボタンが無効化される', () => {
      render(<Submitting />);

      const submitButton = screen.getByRole('button', {
        name: /登録中|送信中/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  // 登録完了
  describe('登録完了画面', () => {
    it('完了画面に「登録が完了しました」メッセージが表示される', () => {
      render(<Completion />);

      expect(screen.getByText(/登録が完了しました/)).toBeInTheDocument();
    });

    it('完了画面に「はじめる」ボタンが表示される', () => {
      render(<Completion />);

      expect(
        screen.getByRole('button', { name: /はじめる/ }),
      ).toBeInTheDocument();
    });
  });

  // モーダル表示制御
  describe('モーダル表示制御', () => {
    it('isOpen=falseの場合はモーダルが表示されない', () => {
      render(<Closed />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('プロフィール設定モーダルは閉じるボタンでは閉じない（必須入力のため）', () => {
      render(<Step1Default />);

      // 閉じるボタン（X）が存在しないことを確認
      expect(
        screen.queryByRole('button', { name: /閉じる|close/i }),
      ).not.toBeInTheDocument();
    });
  });

  // アクセシビリティ
  describe('アクセシビリティ', () => {
    it('モーダルにはrole="dialog"が設定されている', () => {
      render(<Step1Default />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('モーダルにはaria-labelまたはaria-labelledbyが設定されている', () => {
      render(<Step1Default />);

      const dialog = screen.getByRole('dialog');
      expect(
        dialog.hasAttribute('aria-label') ||
          dialog.hasAttribute('aria-labelledby'),
      ).toBe(true);
    });
  });
});
