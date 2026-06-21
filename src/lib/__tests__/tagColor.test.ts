import { describe, expect, it } from 'vitest';

import { deriveTagColors, parseOklch } from '../tagColor';

describe('parseOklch', () => {
  it('oklch(L C H) をパースできる', () => {
    expect(parseOklch('oklch(0.65 0.15 350)')).toEqual({
      l: 0.65,
      c: 0.15,
      h: 350,
    });
  });

  it('L を % で受け付ける', () => {
    expect(parseOklch('oklch(65% 0.15 350)')).toEqual({
      l: 0.65,
      c: 0.15,
      h: 350,
    });
  });

  it('deg 付き・alpha 付きも許容する', () => {
    expect(parseOklch('oklch(0.65 0.15 350deg / 0.5)')).toEqual({
      l: 0.65,
      c: 0.15,
      h: 350,
    });
  });

  it('不正な文字列は null を返す', () => {
    expect(parseOklch('#ff0000')).toBeNull();
    expect(parseOklch('rgb(1,2,3)')).toBeNull();
    expect(parseOklch('not a color')).toBeNull();
  });

  it('不正な数値（1..2 など）は null を返す', () => {
    expect(parseOklch('oklch(1..2 0.1 350)')).toBeNull();
    expect(parseOklch('oklch(0.5 .. 350)')).toBeNull();
    expect(parseOklch('oklch(0.5 0.1 35.)')).toBeNull();
  });
});

describe('deriveTagColors', () => {
  it('基準色から bg/text を同色相で導出する', () => {
    const colors = deriveTagColors('oklch(0.65 0.15 350)');
    expect(colors).not.toBeNull();
    expect(colors?.bg).toBe('oklch(0.96 0.045 350)');
    expect(colors?.text).toBe('oklch(0.42 0.140 350)');
  });

  it('null / 空文字 / 不正値は null を返す', () => {
    expect(deriveTagColors(null)).toBeNull();
    expect(deriveTagColors(undefined)).toBeNull();
    expect(deriveTagColors('')).toBeNull();
    expect(deriveTagColors('#ff0000')).toBeNull();
  });
});
