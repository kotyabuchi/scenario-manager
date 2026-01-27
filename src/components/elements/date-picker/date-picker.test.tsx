import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker, parseDate } from './date-picker';

describe('DatePicker', () => {
  describe('レンダリング', () => {
    // DTP-01: デフォルト状態で正しく表示される
    it('入力フィールドをレンダリングできる', () => {
      render(<DatePicker onValueChange={vi.fn()} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    // DTP-02: プレースホルダーが表示される
    it('プレースホルダーを表示できる', () => {
      render(<DatePicker placeholder="日付を入力" onValueChange={vi.fn()} />);

      expect(screen.getByPlaceholderText('日付を入力')).toBeInTheDocument();
    });

    // DTP-03: 選択日が入力ボックスに表示される
    it('選択中の日付を表示できる', () => {
      const selectedDate = [parseDate('2024-06-15')];

      render(<DatePicker value={selectedDate} onValueChange={vi.fn()} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('2024/06/15');
    });

    // DTP-04: コンポーネントが正しくレンダリングされる
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

  describe('カレンダー操作', () => {
    // DTP-05: カレンダーが開く
    it('カレンダーアイコンをクリックするとカレンダーが開く', async () => {
      const user = userEvent.setup();

      render(<DatePicker onValueChange={vi.fn()} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });

    // DTP-06: 日付を選択できる
    it('日付をクリックして選択できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<DatePicker onValueChange={handleValueChange} />);

      // カレンダーを開く
      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // 日付セルをクリック（例: 15日）
      const dayCell = screen.getByRole('button', { name: /15/ });
      if (dayCell) {
        await user.click(dayCell);
        expect(handleValueChange).toHaveBeenCalled();
      }
    });
  });

  describe('無効状態', () => {
    // DTP-07: disabled時は操作できない
    it('disabled状態ではカレンダーが開かない', async () => {
      const user = userEvent.setup();

      render(<DatePicker disabled onValueChange={vi.fn()} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // DTP-08: 入力フィールドにアクセスできる
    it('入力フィールドにrole="textbox"がある', () => {
      render(<DatePicker onValueChange={vi.fn()} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // DTP-09: カレンダートリガーにアクセスできる
    it('カレンダートリガーにrole="button"がある', () => {
      render(<DatePicker onValueChange={vi.fn()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
