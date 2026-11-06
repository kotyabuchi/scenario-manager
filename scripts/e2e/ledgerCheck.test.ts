import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { impactFixture } from './fixtures/selection';
import { surfaceLedgerFixture } from './fixtures/surfaceLedger';
import { writeArtifact } from './ledgerArtifacts';
import { runLedgerCheck } from './ledgerCheck';
import {
  baselineDigest,
  checkStaticState,
  collectStaticState,
} from './staticGate';
import { SurfacePendingSubsetError } from './surfacePendingDiagnostic';
import { resolveRevisions } from './trustedRevision';

vi.mock('./ledgerArtifacts', () => ({ writeArtifact: vi.fn() }));
vi.mock('./staticGate', () => ({
  baselineDigest: vi.fn(),
  checkStaticState: vi.fn(),
  collectStaticState: vi.fn(),
}));
vi.mock('./trustedRevision', () => ({ resolveRevisions: vi.fn() }));

const artifactPath = 'test-results/quality/static-gate.json';
const root = '/fixture';
const revisions = {
  base: 'a'.repeat(40),
  head: 'b'.repeat(40),
  mode: 'local' as const,
};
const baseline = 'c'.repeat(64);
const fixture = impactFixture();
const surface = surfaceLedgerFixture();
const env: NodeJS.ProcessEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.invalid',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'fixture-anon-key',
  NODE_ENV: 'test',
};
const check = () => runLedgerCheck(['--base', revisions.base], root, env);
const savedReport = () => {
  const latest = vi.mocked(writeArtifact).mock.lastCall;
  if (!latest) throw new Error('静的証跡がありません');
  expect(latest.slice(0, 2)).toEqual([root, artifactPath]);
  return JSON.parse(latest[2]) as unknown;
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(resolveRevisions).mockResolvedValue(revisions);
  vi.mocked(baselineDigest).mockReturnValue(baseline);
  vi.mocked(collectStaticState).mockResolvedValue({
    inventory: fixture.inventories.working,
    ledger: fixture.ledger,
    baseline: fixture.baseline,
    legacy: fixture.legacy,
    registrations: 1,
    surfacePending: surface.pending,
  });
  vi.mocked(checkStaticState).mockResolvedValue({
    ...surface.receipt,
    issues: [],
    policyDeltas: [],
    isBootstrap: false,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('単独の静的台帳CLI', () => {
  it('成功時は既存の最終JSONを標準出力へ返す', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const expected = {
      stage: 'M1-static',
      status: 'passed',
      ...revisions,
      baselineDigest: baseline,
      registrations: 1,
      pendingItems: fixture.baseline.items.length,
      legacyTests: fixture.legacy.tests.length,
      ...surface.receipt,
      issues: [],
      policyDeltas: [],
      isBootstrap: false,
    };

    await expect(check()).resolves.toBe(true);
    expect(savedReport()).toEqual(expected);
    expect(stdout).toHaveBeenCalledExactlyOnceWith(
      `${JSON.stringify(expected)}\n`,
    );
  });

  it('UI不足の表示に失敗しても、保存済み診断と失敗状態を保持する', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => {
      throw new Error('private display error');
    });
    vi.mocked(checkStaticState).mockRejectedValueOnce(
      new SurfacePendingSubsetError([
        {
          category: 'render-diagnostic',
          entry: { kind: 'product', id: 'public-entry' },
          mountSiteIds: [],
          code: 'private-code',
          anchor: {
            ownerId: 'private-anchor',
            syntaxHash: 'd'.repeat(64),
            occurrence: 0,
          },
        },
      ]),
    );

    await expect(check()).rejects.toThrow('UI_SURFACE_PENDING_ADDED');
    const details = [
      {
        entry: 'public-entry',
        site: null,
        code: 'UI_SURFACE_RENDER_DIAGNOSTIC',
      },
    ];
    expect(savedReport()).toEqual({
      stage: 'M1-static',
      status: 'failed',
      ...revisions,
      failure: 'UI_SURFACE_PENDING_ADDED',
      details,
    });
    expect(stderr).toHaveBeenCalledExactlyOnceWith(
      `[e2e-static] ${JSON.stringify({
        failure: 'UI_SURFACE_PENDING_ADDED',
        artifactPath,
        total: 1,
        omitted: 0,
        items: details,
      })}\n`,
    );
  });

  it('不正な引数は入力値を表示せず、固定の使用法を案内する', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    await expect(
      runLedgerCheck(['--private-argument'], root, env),
    ).rejects.toThrow('INVALID_ARGUMENTS');
    expect(savedReport()).toEqual({
      stage: 'M1-static',
      status: 'failed',
      failure: 'INVALID_ARGUMENTS',
    });
    expect(stderr).toHaveBeenCalledExactlyOnceWith(
      `[e2e-static] ${JSON.stringify({
        failure: 'INVALID_ARGUMENTS',
        artifactPath,
        usage: '使用法: e2e:ledger:check --base <比較ref>（CIでは引数なし）',
      })}\n`,
    );
    expect(stdout).not.toHaveBeenCalled();
    expect(resolveRevisions).not.toHaveBeenCalled();
    expect(collectStaticState).not.toHaveBeenCalled();
  });

  it('比較元解決の生エラーを証跡・CLIへ出さない', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    vi.mocked(resolveRevisions).mockRejectedValueOnce(
      new Error('private ref or secret'),
    );

    await expect(check()).rejects.toThrow('STATIC_LEDGER_CHECK_FAILED');
    expect(savedReport()).toEqual({
      stage: 'M1-static',
      status: 'failed',
      failure: 'STATIC_LEDGER_CHECK_FAILED',
    });
    expect(stderr).toHaveBeenCalledExactlyOnceWith(
      `[e2e-static] ${JSON.stringify({ failure: 'STATIC_LEDGER_CHECK_FAILED', artifactPath })}\n`,
    );
    expect(collectStaticState).not.toHaveBeenCalled();
  });
});
