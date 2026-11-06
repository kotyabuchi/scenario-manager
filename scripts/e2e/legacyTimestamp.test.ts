import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  legacyTimestampAtOrAfter,
  legacyTimestampSchema,
} from '../../e2e/fixtures/legacyTimestamp';

afterEach(() => vi.unstubAllEnvs());

describe('legacy DB作成日時のUTC比較', () => {
  it.each([
    'Asia/Tokyo',
    'America/Los_Angeles',
    'UTC',
  ])('naive値をホストTZ=%sに依存せずUTCで比較する', (timezone) => {
    vi.stubEnv('TZ', timezone);
    expect(
      legacyTimestampAtOrAfter(
        '2026-11-05T00:00:00.123456',
        '2026-11-05T00:00:00.123Z',
      ),
    ).toBe(true);
    expect(
      legacyTimestampAtOrAfter(
        '2026-11-05T00:00:00.122999',
        '2026-11-05T00:00:00.123Z',
      ),
    ).toBe(false);
    expect(
      legacyTimestampAtOrAfter('2026-11-05T00:00:00', '2026-11-05T00:00:00Z'),
    ).toBe(true);
  });

  it('offsetの正負とマイクロ秒境界を保持する', () => {
    expect(
      legacyTimestampAtOrAfter(
        '2026-11-05T09:00:00.123456+09:00',
        '2026-11-05T00:00:00.123456Z',
      ),
    ).toBe(true);
    expect(
      legacyTimestampAtOrAfter(
        '2026-11-04T19:00:00.123455-05:00',
        '2026-11-05T00:00:00.123456Z',
      ),
    ).toBe(false);
    expect(
      legacyTimestampAtOrAfter(
        '2026-11-05T00:00:00.000001',
        '2026-11-05T00:00:00.000002Z',
      ),
    ).toBe(false);
  });

  it.each([
    '2026-02-30T00:00:00',
    '2026-11-05T00:00:00+25:00',
    '2026-11-05',
    '2026-11-05T24:00:00',
    '2026-11-05T00:00:00.1234567',
    'invalid',
    '',
  ])('不正日時を拒否し成功判定へ流さない: %s', (value) => {
    expect(legacyTimestampSchema.safeParse(value).success).toBe(false);
    expect(() =>
      legacyTimestampAtOrAfter(value, '2026-11-05T00:00:00Z'),
    ).toThrow();
  });
});
