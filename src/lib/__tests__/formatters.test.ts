import { describe, expect, it, vi } from 'vitest';

import { formatRelativeTime } from '../formatters';

describe('formatRelativeTime', () => {
  it('1分未満は「たった今」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-02-12T11:59:30Z')).toBe('たった今');
    vi.useRealTimers();
  });

  it('1分〜59分は「N分前」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-02-12T11:55:00Z')).toBe('5分前');
    expect(formatRelativeTime('2026-02-12T11:01:00Z')).toBe('59分前');
    vi.useRealTimers();
  });

  it('1時間〜23時間は「N時間前」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-02-12T11:00:00Z')).toBe('1時間前');
    expect(formatRelativeTime('2026-02-11T13:00:00Z')).toBe('23時間前');
    vi.useRealTimers();
  });

  it('1日前は「昨日」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-02-11T12:00:00Z')).toBe('昨日');
    vi.useRealTimers();
  });

  it('2日〜6日は「N日前」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-02-10T12:00:00Z')).toBe('2日前');
    expect(formatRelativeTime('2026-02-06T12:00:00Z')).toBe('6日前');
    vi.useRealTimers();
  });

  it('7日〜29日は「N週間前」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-02-05T12:00:00Z')).toBe('1週間前');
    expect(formatRelativeTime('2026-01-22T12:00:00Z')).toBe('3週間前');
    vi.useRealTimers();
  });

  it('30日以上は「Nヶ月前」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-01-10T12:00:00Z')).toBe('1ヶ月前');
    expect(formatRelativeTime('2025-09-12T12:00:00Z')).toBe('5ヶ月前');
    vi.useRealTimers();
  });

  it('未来の日付は「たった今」', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    expect(formatRelativeTime('2026-02-13T12:00:00Z')).toBe('たった今');
    vi.useRealTimers();
  });

  it('12ヶ月以上は日付表示', () => {
    const now = new Date('2026-02-12T12:00:00Z');
    vi.setSystemTime(now);
    const result = formatRelativeTime('2024-12-01T12:00:00Z');
    expect(result).toMatch(/2024/);
    vi.useRealTimers();
  });
});
