import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './select';

const mockItems = [
  { label: 'りんご', value: 'apple' },
  { label: 'バナナ', value: 'banana' },
  { label: 'オレンジ', value: 'orange' },
];

describe('Select', () => {
  it('プレースホルダーを表示できる', () => {
    render(
      <Select
        items={mockItems}
        placeholder="果物を選択"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByText('果物を選択')).toBeInTheDocument();
  });

  it('選択中の値を表示できる', () => {
    render(
      <Select items={mockItems} value={['apple']} onValueChange={vi.fn()} />,
    );
    // トリガー要素内に選択された値が表示される
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('りんご');
  });

  it('クリックでドロップダウンが開く', async () => {
    const user = userEvent.setup();

    render(<Select items={mockItems} onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('disabled状態では開かない', async () => {
    const user = userEvent.setup();

    render(<Select items={mockItems} disabled onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-disabled', '');

    await user.click(trigger);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(
      <Select
        items={mockItems}
        value={['banana']}
        placeholder="選択してください"
        name="fruit"
        onValueChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('バナナ');
  });

  it('複数選択モードでレンダリングできる', () => {
    render(<Select items={mockItems} multiple onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });
});
