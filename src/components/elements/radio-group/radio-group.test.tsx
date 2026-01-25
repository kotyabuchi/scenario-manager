import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { RadioGroup } from './radio-group';

const mockItems = [
  { label: '公開', value: 'public' },
  { label: '非公開', value: 'private' },
  { label: '限定公開', value: 'limited' },
];

describe('RadioGroup', () => {
  it('すべての選択肢を表示できる', () => {
    render(<RadioGroup items={mockItems} onValueChange={vi.fn()} />);

    expect(screen.getByText('公開')).toBeInTheDocument();
    expect(screen.getByText('非公開')).toBeInTheDocument();
    expect(screen.getByText('限定公開')).toBeInTheDocument();
  });

  it('選択中の値がチェックされる', () => {
    render(
      <RadioGroup items={mockItems} value="private" onValueChange={vi.fn()} />,
    );

    const privateRadio = screen.getByRole('radio', { name: '非公開' });
    expect(privateRadio).toBeChecked();
  });

  it('ラジオボタンをクリックするとonValueChangeが呼ばれる', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<RadioGroup items={mockItems} onValueChange={handleChange} />);

    const publicRadio = screen.getByRole('radio', { name: '公開' });
    await user.click(publicRadio);

    expect(handleChange).toHaveBeenCalled();
  });

  it('disabled状態では選択できない', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <RadioGroup items={mockItems} disabled onValueChange={handleChange} />,
    );

    const publicRadio = screen.getByRole('radio', { name: '公開' });
    await user.click(publicRadio);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('特定のアイテムのみdisabledにできる', () => {
    const itemsWithDisabled = [
      { label: '公開', value: 'public' },
      { label: '非公開', value: 'private', disabled: true },
      { label: '限定公開', value: 'limited' },
    ];

    render(<RadioGroup items={itemsWithDisabled} onValueChange={vi.fn()} />);

    const privateRadio = screen.getByRole('radio', { name: '非公開' });
    expect(privateRadio).toBeDisabled();

    const publicRadio = screen.getByRole('radio', { name: '公開' });
    expect(publicRadio).not.toBeDisabled();
  });

  it('デフォルト値を設定できる', () => {
    render(
      <RadioGroup
        items={mockItems}
        defaultValue="limited"
        onValueChange={vi.fn()}
      />,
    );

    const limitedRadio = screen.getByRole('radio', { name: '限定公開' });
    expect(limitedRadio).toBeChecked();
  });

  it('name属性を設定できる', () => {
    render(
      <RadioGroup
        items={mockItems}
        name="visibility"
        onValueChange={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole('radio');
    for (const radio of radios) {
      expect(radio).toHaveAttribute('name', 'visibility');
    }
  });
});
