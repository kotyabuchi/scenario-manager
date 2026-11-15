import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import * as stories from './AvailabilityWorkspaces.stories';

const { Submit, Confirm, ConfirmSaveError } = composeStories(stories);

describe('SubmitAvailabilityWorkspace', () => {
  it('カレンダーとパネルが表示される', () => {
    render(<Submit />);

    expect(screen.getByText('スケジュールカレンダー')).toBeInTheDocument();
    expect(screen.getByText('自分のスケジュール')).toBeInTheDocument();
  });

  it('サイドバーに他ユーザーのスケジュールが表示される', () => {
    render(<Submit />);

    // デスクトップ + モバイル両方に描画されるため複数存在する
    expect(screen.getAllByText('他の人のスケジュール').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('GM 佐藤').length).toBeGreaterThan(0);
  });

  it('スケジュールのサマリーが表示される', () => {
    render(<Submit />);

    expect(screen.getByText('1件')).toBeInTheDocument();
  });

  it('保存ボタンが表示される', () => {
    render(<Submit />);

    expect(
      screen.getAllByRole('button', { name: /提出を保存/ }).length,
    ).toBeGreaterThan(0);
  });
});

describe('ConfirmAvailabilityWorkspace', () => {
  it('カレンダーとパネルが表示される', () => {
    render(<Confirm />);

    expect(screen.getByText('日程確定カレンダー')).toBeInTheDocument();
    expect(screen.getByText('確定候補')).toBeInTheDocument();
  });

  it('おすすめ候補が表示される', () => {
    render(<Confirm />);

    expect(screen.getAllByText('おすすめ候補').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText('全ユーザー参加できる候補').length,
    ).toBeGreaterThan(0);
  });

  it('確定日程のサマリーが表示される', () => {
    render(<Confirm />);

    expect(screen.getByText('1件')).toBeInTheDocument();
  });

  it('通常位置と固定バーの両方から確定保存を試せる', async () => {
    const user = userEvent.setup();
    render(<ConfirmSaveError />);

    // エラー表示後も保存遷移は続くため、ラベルと有効状態の復帰を待つ。
    for (const index of [0, 1]) {
      await waitFor(() => {
        const buttons = screen.getAllByText(
          (_, element) => element?.textContent === '日程を確定',
          { selector: 'button' },
        );
        expect(buttons).toHaveLength(2);
        const current = buttons[index];
        if (!current) throw new Error('確定ボタンがありません');
        expect(current).toBeEnabled();
      });
      const buttons = screen.getAllByRole('button', { name: '日程を確定' });
      expect(buttons).toHaveLength(2);
      const button = buttons[index];
      if (!button) throw new Error('確定ボタンがありません');
      expect(button).toBeEnabled();
      await user.click(button);
      await screen.findAllByText(`保存に失敗しました（${index + 1}回目）`);
    }
  });

  it('見学者注記が表示される', () => {
    render(<Confirm />);

    expect(
      screen.getAllByText('ここから下は見学者が参加できない候補です').length,
    ).toBeGreaterThan(0);
  });
});
