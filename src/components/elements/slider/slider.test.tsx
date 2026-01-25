import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Slider } from './slider';

describe('Slider', () => {
  it('スライダーをレンダリングできる', () => {
    render(<Slider value={[50]} onValueChange={vi.fn()} />);

    // Ark UIはsliderロールを持つ要素をレンダリングする
    const sliders = screen.getAllByRole('slider', { hidden: true });
    expect(sliders.length).toBeGreaterThan(0);
  });

  it('ラベルを表示できる', () => {
    render(<Slider value={[50]} label="音量" onValueChange={vi.fn()} />);

    expect(screen.getByText('音量')).toBeInTheDocument();
  });

  it('値を表示できる（showValue）', () => {
    render(<Slider value={[50]} showValue onValueChange={vi.fn()} />);

    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('範囲スライダーでは2つの値を表示できる', () => {
    render(<Slider value={[20, 80]} range showValue onValueChange={vi.fn()} />);

    expect(screen.getByText('20 - 80')).toBeInTheDocument();
  });

  it('カスタムフォーマット関数を使用できる', () => {
    render(
      <Slider
        value={[50]}
        showValue
        formatValue={(v) => `${v}%`}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('範囲スライダーでは2つのサムが表示される', () => {
    render(<Slider value={[20, 80]} range onValueChange={vi.fn()} />);

    // 範囲スライダーは2つのslider roleを持つ
    const sliders = screen.getAllByRole('slider', { hidden: true });
    expect(sliders).toHaveLength(2);
  });

  it('マーカーを表示できる', () => {
    const markers = [
      { value: 0, label: '0' },
      { value: 50, label: '50' },
      { value: 100, label: '100' },
    ];

    render(<Slider value={[50]} markers={markers} onValueChange={vi.fn()} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('disabled状態でレンダリングされる', () => {
    render(<Slider value={[50]} disabled onValueChange={vi.fn()} />);

    // disabledのスライダーはdata-disabled属性を持つ
    const sliders = screen.getAllByRole('slider', { hidden: true });
    expect(sliders[0]).toHaveAttribute('data-disabled', '');
  });
});
