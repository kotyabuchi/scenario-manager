import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Divider } from './Divider';

describe('Divider', () => {
  // DIV-01: separator として描画される
  it('separator ロールで描画される', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  // DIV-02: 既定（フル幅）ではインライン width を付けない
  it('width 未指定ではインライン width を持たない', () => {
    render(<Divider />);
    const hr = screen.getByRole('separator');
    expect(hr.getAttribute('style') ?? '').not.toContain('width');
  });

  // DIV-03: width 指定で % が入る
  it('width=50 で width:50% が適用される', () => {
    render(<Divider width={50} />);
    expect(screen.getByRole('separator').getAttribute('style')).toContain(
      'width: 50%',
    );
  });

  // DIV-04: 100 はフル幅扱い（インライン width なし）
  it('width=100 はフル幅扱い（インライン width なし）', () => {
    render(<Divider width={100} />);
    expect(
      screen.getByRole('separator').getAttribute('style') ?? '',
    ).not.toContain('width');
  });

  // DIV-05: 範囲外はクランプされる
  it('100超は100%扱い、0未満は0%にクランプ', () => {
    const { rerender } = render(<Divider width={150} />);
    expect(
      screen.getByRole('separator').getAttribute('style') ?? '',
    ).not.toContain('width');

    rerender(<Divider width={-20} />);
    expect(screen.getByRole('separator').getAttribute('style')).toContain(
      'width: 0%',
    );
  });
});
