import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './AvailabilityWorkspaces.stories';

const { Submit, Confirm } = composeStories(stories);

describe('SubmitAvailabilityWorkspace', () => {
  it('カレンダーとパネルが表示される', () => {
    render(<Submit />);

    expect(screen.getByText('参加可能日カレンダー')).toBeInTheDocument();
    expect(screen.getByText('自分の提出枠')).toBeInTheDocument();
  });

  it('サイドバーに他ユーザーの提出枠が表示される', () => {
    render(<Submit />);

    // デスクトップ + モバイル両方に描画されるため複数存在する
    expect(screen.getAllByText('他の人の提出枠').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GM 佐藤').length).toBeGreaterThan(0);
  });

  it('提出枠のサマリーが表示される', () => {
    render(<Submit />);

    expect(screen.getByText('1枠')).toBeInTheDocument();
  });

  it('保存ボタンが表示される', () => {
    render(<Submit />);

    expect(
      screen.getByRole('button', { name: /提出を保存/ }),
    ).toBeInTheDocument();
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

  it('確定枠のサマリーが表示される', () => {
    render(<Confirm />);

    expect(screen.getByText('1枠')).toBeInTheDocument();
  });

  it('確定ボタンが表示される', () => {
    render(<Confirm />);

    expect(
      screen.getByRole('button', { name: /日程を確定/ }),
    ).toBeInTheDocument();
  });

  it('見学者注記が表示される', () => {
    render(<Confirm />);

    expect(
      screen.getAllByText('ここから下は見学者が参加できない候補です').length,
    ).toBeGreaterThan(0);
  });
});
