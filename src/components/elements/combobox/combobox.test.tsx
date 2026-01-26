import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Combobox } from './combobox';

const mockItems = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
];

describe('Combobox', () => {
  it('プレースホルダーを表示できる', () => {
    render(
      <Combobox
        items={mockItems}
        placeholder="フレームワークを検索"
        onValueChange={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText('フレームワークを検索'),
    ).toBeInTheDocument();
  });

  it('入力フィールドに文字を入力できる', async () => {
    const user = userEvent.setup({ delay: null });

    render(<Combobox items={mockItems} onValueChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'React');

    await waitFor(() => {
      expect(input).toHaveValue('React');
    });
  });

  it('入力するとドロップダウンが開く', async () => {
    const user = userEvent.setup();

    render(<Combobox items={mockItems} onValueChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    await user.click(input);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('disabled状態では入力できない', () => {
    render(<Combobox items={mockItems} disabled onValueChange={vi.fn()} />);

    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(
      <Combobox
        items={mockItems}
        placeholder="検索..."
        name="framework"
        onValueChange={vi.fn()}
      />,
    );

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '検索...');
  });
});
