import { describe, expect, it } from 'vitest';

import { sanitizePositiveInt, sanitizeText } from '../sanitizer';

describe('sanitizeText', () => {
  it('HTMLタグを除去する', () => {
    expect(sanitizeText('<b>太字</b>テキスト')).toBe('太字テキスト');
  });

  it('scriptタグを除去する', () => {
    expect(sanitizeText('<script>alert("xss")</script>安全')).toBe(
      'alert("xss")安全',
    );
  });

  it('HTMLエンティティをデコードする', () => {
    expect(sanitizeText('A &amp; B &lt; C')).toBe('A & B < C');
  });

  it('制御文字を除去する', () => {
    expect(sanitizeText('hello\x00world\x07!')).toBe('helloworld!');
  });

  it('前後の空白を除去する', () => {
    expect(sanitizeText('  テスト  ')).toBe('テスト');
  });

  it('通常の文字列はそのまま返す', () => {
    expect(sanitizeText('新クトゥルフ神話TRPG / カタシロ')).toBe(
      '新クトゥルフ神話TRPG / カタシロ',
    );
  });

  it('ダブルエンコードされたHTMLタグを除去する', () => {
    expect(sanitizeText('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe(
      'alert(1)',
    );
  });
});

describe('sanitizePositiveInt', () => {
  it('正の整数をそのまま返す', () => {
    expect(sanitizePositiveInt(5)).toBe(5);
  });

  it('小数を四捨五入する', () => {
    expect(sanitizePositiveInt(3.7)).toBe(4);
  });

  it('負数は null を返す', () => {
    expect(sanitizePositiveInt(-1)).toBeNull();
  });

  it('NaN は null を返す', () => {
    expect(sanitizePositiveInt(Number.NaN)).toBeNull();
  });

  it('Infinity は null を返す', () => {
    expect(sanitizePositiveInt(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('0 を受け入れる', () => {
    expect(sanitizePositiveInt(0)).toBe(0);
  });
});
