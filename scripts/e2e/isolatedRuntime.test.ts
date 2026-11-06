import { describe, expect, it } from 'vitest';

import {
  ISOLATED_APP_PORT,
  ISOLATED_BASE_URL,
  ISOLATED_STORYBOOK_PORT,
  ISOLATED_SUPABASE_PORTS,
} from '../../e2e/isolatedRuntime';

const ports = {
  ...ISOLATED_SUPABASE_PORTS,
  app: ISOLATED_APP_PORT,
  storybook: ISOLATED_STORYBOOK_PORT,
};

describe('専用runtimeの固定ポート方針', () => {
  // Linux既定32768–60999、Windows既定49152–65535の両方を避ける。
  it.each(
    Object.entries(ports),
  )('%sは既定の動的割当範囲に入らない', (_, port) => {
    expect(Number.isInteger(port)).toBe(true);
    expect(port).toBeGreaterThanOrEqual(1024);
    expect(port).toBeLessThan(32768);
  });

  it('専用サービス同士と開発用ポートを重複させない', () => {
    const values = Object.values(ports);
    expect(new Set(values).size).toBe(values.length);
    const developmentPorts = [
      3000, 3100, 3333, 6006, 8083, 9323, 54320, 54321, 54322, 54323, 54324,
      54327, 54329,
    ];
    expect(values.filter((port) => developmentPorts.includes(port))).toEqual(
      [],
    );
  });

  it('共通base URLがアプリのポート定数と一致する', () => {
    expect(new URL(ISOLATED_BASE_URL).port).toBe(String(ISOLATED_APP_PORT));
  });
});
