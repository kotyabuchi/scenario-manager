import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker, parseDate } from './date-picker';

describe('DatePicker', () => {
  it('入力フィールドをレンダリングできる', () => {
    render(<DatePicker onValueChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('プレースホルダーを表示できる', () => {
    render(<DatePicker placeholder="日付を入力" onValueChange={vi.fn()} />);

    expect(screen.getByPlaceholderText('日付を入力')).toBeInTheDocument();
  });

  it('カレンダーアイコンをクリックするとカレンダーが開く', async () => {
    const user = userEvent.setup();

    render(<DatePicker onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });

  it('disabled状態ではカレンダーが開かない', async () => {
    const user = userEvent.setup();

    render(<DatePicker disabled onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('選択中の日付を表示できる', () => {
    const selectedDate = [parseDate('2024-06-15')];

    render(<DatePicker value={selectedDate} onValueChange={vi.fn()} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('2024/06/15');
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(
      <DatePicker
        placeholder="日付を選択"
        name="date"
        id="date-input"
        onValueChange={vi.fn()}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'date-input');
    expect(input).toHaveAttribute('placeholder', '日付を選択');
  });
});
