import { describe, expect, it } from 'vitest';

import { generateUserName } from '../utils';

describe('generateUserName', () => {
  // GEN-01: 英数字のみのDiscord名はそのまま返す
  it('英数字のみのDiscord名はそのまま返す', () => {
    expect(generateUserName('taro123')).toBe('taro123');
  });

  // GEN-02: 特殊文字をアンダースコアに置換
  it('特殊文字をアンダースコアに置換する', () => {
    expect(generateUserName('taro@#$yamada')).toBe('taro_yamada');
  });

  // GEN-03: 20文字を超える場合は切り詰め
  it('20文字を超える場合は20文字に切り詰める', () => {
    const longName = 'a'.repeat(25);
    const result = generateUserName(longName);
    expect(result.length).toBeLessThanOrEqual(20);
  });

  // GEN-04: 3文字未満の場合はパディング
  it('3文字未満の場合はアンダースコアでパディングする', () => {
    const result = generateUserName('ab');
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  // GEN-05: 空文字の場合はデフォルト値を返す
  it('空文字の場合はデフォルト値を返す', () => {
    const result = generateUserName('');
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result).toMatch(/^[a-zA-Z0-9_]+$/);
  });

  // GEN-06: 連続するアンダースコアを1つに圧縮
  it('連続するアンダースコアを1つに圧縮する', () => {
    expect(generateUserName('taro---yamada')).toBe('taro_yamada');
  });
});
