import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NumberInput } from './number-input';

describe('NumberInput', () => {
  it('初期値を表示できる', () => {
    render(<NumberInput value="50" onValueChange={vi.fn()} />);
    expect(screen.getByRole('spinbutton')).toHaveValue('50');
  });

  it('ラベルを表示できる', () => {
    render(<NumberInput label="数量" onValueChange={vi.fn()} />);
    expect(screen.getByText('数量')).toBeInTheDocument();
  });

  it('増加ボタンをクリックすると値が増える', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NumberInput value="5" onValueChange={handleChange} min={0} max={10} />,
    );

    const incrementButton = screen.getByLabelText('increment value');
    await user.click(incrementButton);

    expect(handleChange).toHaveBeenCalled();
  });

  it('減少ボタンをクリックすると値が減る', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <NumberInput value="5" onValueChange={handleChange} min={0} max={10} />,
    );

    const decrementButton = screen.getByLabelText('decrease value');
    await user.click(decrementButton);

    expect(handleChange).toHaveBeenCalled();
  });

  it('disabled状態ではクリックできない', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<NumberInput value="5" onValueChange={handleChange} disabled />);

    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();

    await user.type(input, '10');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('min/maxの範囲制限が適用される', () => {
    render(<NumberInput value="5" onValueChange={vi.fn()} min={0} max={10} />);

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
  });

  it('stepを指定できる', () => {
    render(<NumberInput value="5" onValueChange={vi.fn()} step={5} />);

    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });
});
