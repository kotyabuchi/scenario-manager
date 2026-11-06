import { afterEach, describe, expect, it, vi } from 'vitest';

const loadConfig = async () => {
  vi.resetModules();
  return (await import('../../next.config')).default;
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('専用Next環境のbuildとreadiness契約', () => {
  it('通常buildに専用出力先や所有ヘッダーを混入させない', async () => {
    vi.stubEnv('SCENARIO_E2E_BUILD', undefined);
    vi.stubEnv('SCENARIO_E2E_RUN_ID', '012345abcdef');
    const config = await loadConfig();
    expect(config.distDir).toBeUndefined();
    expect(config.typescript?.tsconfigPath).toBeUndefined();
    expect(await config.headers?.()).toEqual([]);
  });

  it('run別の出力先・型設定・readiness所有ヘッダーを揃える', async () => {
    vi.stubEnv('SCENARIO_E2E_BUILD', '1');
    vi.stubEnv('SCENARIO_E2E_RUN_ID', '012345abcdef');
    const config = await loadConfig();
    expect(config.distDir).toBe('.next-e2e/run-012345abcdef');
    expect(config.typescript?.tsconfigPath).toBe(
      'test-results/environments/run-012345abcdef/app/tsconfig.json',
    );
    expect(await config.headers?.()).toEqual([
      {
        source: '/:path*',
        headers: [{ key: 'x-scenario-e2e-run-id', value: '012345abcdef' }],
      },
    ]);
  });

  it('run IDを持たない既存E2E buildでは従来の出力先を保つ', async () => {
    vi.stubEnv('SCENARIO_E2E_BUILD', '1');
    vi.stubEnv('SCENARIO_E2E_RUN_ID', undefined);
    const config = await loadConfig();
    expect(config.distDir).toBe('.next-e2e');
    expect(config.typescript?.tsconfigPath).toBeUndefined();
    expect(await config.headers?.()).toEqual([]);
  });

  it('不正なrun IDを設定読込時に拒否する', async () => {
    vi.stubEnv('SCENARIO_E2E_BUILD', '1');
    vi.stubEnv('SCENARIO_E2E_RUN_ID', '../another-run');
    await expect(loadConfig()).rejects.toThrow('SCENARIO_E2E_RUN_IDが不正');
  });
});
