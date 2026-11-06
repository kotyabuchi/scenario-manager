import { beforeEach, describe, expect, it, vi } from 'vitest';

import { surfaceLedgerFixture } from './fixtures/surfaceLedger';
import { resolveGitCommit } from './gitObjects';
import { writeArtifact } from './ledgerArtifacts';
import { baselineDigest } from './staticGate';
import { readSurfaceMigrationHistoryAtRevision } from './surfaceGate';
import { runSurfaceHistoryCheck } from './surfaceHistoryCheck';
import {
  surfaceMigrationDigest,
  surfacePendingDigest,
} from './surfaceMigration';
import {
  SURFACE_MIGRATION_INTRODUCTION,
  SURFACE_MIGRATION_V1_ORIGIN,
} from './surfaceMigrationHistory';
import { replaySurfaceMigration } from './surfaceMigrationReplay';
import { createSurfaceReplayDiagnosticError } from './surfaceReplayFailure';
import { prepareVerificationDirectory } from './verificationContext';

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { SurfaceMigrationHistoryProof } from './surfaceMigrationHistory';

vi.mock('./gitObjects', async (original) => ({
  ...(await original<typeof import('./gitObjects')>()),
  resolveGitCommit: vi.fn(),
}));
vi.mock('./ledgerArtifacts', async (original) => ({
  ...(await original<typeof import('./ledgerArtifacts')>()),
  writeArtifact: vi.fn(),
}));
vi.mock('./surfaceGate', () => ({
  readSurfaceMigrationHistoryAtRevision: vi.fn(),
}));
vi.mock('./surfaceMigrationReplay', () => ({
  replaySurfaceMigration: vi.fn(),
}));
vi.mock('./verificationContext', async (original) => ({
  ...(await original<typeof import('./verificationContext')>()),
  prepareVerificationDirectory: vi.fn(),
}));

const root = realpathSync(process.cwd());
const artifact = 'test-results/quality/surface-history-check.json';
const verificationDir = join(
  root,
  'test-results',
  'verification',
  'a'.repeat(12),
);
const head = 'b'.repeat(40);
const baseline = { schemaVersion: 1 as const, items: [] };
const { pending, migration } = surfaceLedgerFixture();
const introduced = {
  pending,
  migration: { ...migration, observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN },
};
const proof: SurfaceMigrationHistoryProof = {
  schemaVersion: 1,
  observationBaseSha: SURFACE_MIGRATION_V1_ORIGIN,
  introductionSha: SURFACE_MIGRATION_INTRODUCTION,
  snapshotDigest: 'a'.repeat(64),
  baselineDigest: baselineDigest(baseline),
  surfaceMigrationDigest: surfaceMigrationDigest(introduced.migration),
  surfacePendingDigest: surfacePendingDigest(pending),
};
const failure = { status: 'failed', code: 'SURFACE_HISTORY_CHECK_FAILED' };
const check = () =>
  runSurfaceHistoryCheck(root, { ...process.env, GITHUB_ACTIONS: 'false' });

const createOutput = () => {
  const directory = mkdtempSync(
    join(realpathSync(tmpdir()), 'surface-history-'),
  );
  const output = join(directory, 'step-output');
  writeFileSync(output, '');
  return {
    directory,
    output,
    env: {
      ...process.env,
      GITHUB_ACTIONS: 'true',
      GITHUB_OUTPUT: output,
    },
    cleanup: () => {
      unlinkSync(output);
      rmdirSync(directory);
    },
  };
};

const expectSaved = (report: unknown) =>
  expect(writeArtifact).toHaveBeenCalledExactlyOnceWith(
    root,
    artifact,
    `${JSON.stringify(report, null, 2)}\n`,
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(resolveGitCommit).mockReturnValue(head);
  vi.mocked(readSurfaceMigrationHistoryAtRevision).mockReturnValue({
    introduced,
    baseline,
  });
  vi.mocked(prepareVerificationDirectory).mockReturnValue(verificationDir);
  vi.mocked(replaySurfaceMigration).mockResolvedValue(proof);
});

describe('固定UI移行履歴の単独検証', () => {
  it('固定履歴とHEADを照合し、安全な証明だけを保存する', async () => {
    const result = await check();
    expect(result).toEqual({ status: 'passed', proof });
    expectSaved(result);
    expect(
      readSurfaceMigrationHistoryAtRevision,
    ).toHaveBeenCalledExactlyOnceWith(
      root,
      head,
      'e2e/ledger/pending-baseline.json',
    );
    expect(resolveGitCommit).toHaveBeenCalledTimes(2);
    const [ownership] = vi.mocked(prepareVerificationDirectory).mock.calls;
    expect(ownership).toEqual([root, expect.stringMatching(/^[a-f0-9]{12}$/u)]);
    expect(replaySurfaceMigration).toHaveBeenCalledExactlyOnceWith({
      root,
      directory: join(verificationDir, 'surface-history'),
      signal: expect.any(AbortSignal),
    });
  });

  it('再生した証明が固定baselineと異なる場合は失敗する', async () => {
    vi.mocked(replaySurfaceMigration).mockResolvedValueOnce({
      ...proof,
      baselineDigest: 'f'.repeat(64),
    });
    await expect(check()).resolves.toEqual(failure);
    expectSaved(failure);
  });

  it('再生中にHEADが変わった場合は成功証明を保存しない', async () => {
    vi.mocked(resolveGitCommit)
      .mockReturnValueOnce(head)
      .mockReturnValueOnce('c'.repeat(40));
    await expect(check()).resolves.toEqual(failure);
    expectSaved(failure);
  });

  it('固定履歴を読めない場合は生の例外を出さず、再生もしない', async () => {
    vi.mocked(readSurfaceMigrationHistoryAtRevision).mockImplementationOnce(
      () => {
        throw new Error('private exception', {
          cause: { path: 'private path' },
        });
      },
    );
    await expect(check()).resolves.toEqual(failure);
    expectSaved(failure);
    expect(replaySurfaceMigration).not.toHaveBeenCalled();
  });

  it('再生の型付き失敗から公開可能な区分だけを保存する', async () => {
    const surfaceReplay = {
      step: 'panda',
      processFailure: 'exit-failed',
    } as const;
    vi.mocked(replaySurfaceMigration).mockRejectedValueOnce(
      createSurfaceReplayDiagnosticError(surfaceReplay),
    );
    const expected = { ...failure, surfaceReplay };
    await expect(check()).resolves.toEqual(expected);
    expectSaved(expected);
  });

  it.each([
    'SIGINT',
    'SIGTERM',
  ] as const)('%sを再生に伝え、cleanup終了を待つ', async (event) => {
    const entered = Promise.withResolvers<AbortSignal | undefined>();
    const cleanup = Promise.withResolvers<void>();
    vi.mocked(replaySurfaceMigration).mockImplementationOnce(
      async ({ signal }) => {
        entered.resolve(signal);
        await cleanup.promise;
        signal?.throwIfAborted();
        return proof;
      },
    );
    const listeners = process.listenerCount(event);
    const running = check();
    const signal = await entered.promise;
    try {
      process.emit(event);
      expect(signal?.aborted).toBe(true);
      expect(writeArtifact).not.toHaveBeenCalled();
    } finally {
      cleanup.resolve();
      await running;
    }
    const expected = { status: 'failed', code: 'SURFACE_HISTORY_INTERRUPTED' };
    await expect(running).resolves.toEqual(expected);
    expectSaved(expected);
    expect(process.listenerCount(event)).toBe(listeners);
  });

  it('必須の成果物を保存できない場合は古いファイルを公開しない', async () => {
    const { directory, output, env, cleanup } = createOutput();
    const stale = join(directory, artifact);
    mkdirSync(join(directory, 'test-results', 'quality'), { recursive: true });
    writeFileSync(stale, 'previous contents');
    try {
      vi.mocked(writeArtifact).mockImplementationOnce(() => {
        throw new Error('private write error');
      });
      await expect(runSurfaceHistoryCheck(directory, env)).resolves.toEqual({
        status: 'failed',
        code: 'SURFACE_HISTORY_ARTIFACT_WRITE_FAILED',
      });
      expect(readFileSync(stale, 'utf8')).toBe('previous contents');
      expect(readFileSync(output, 'utf8')).toBe('');
    } finally {
      unlinkSync(stale);
      rmdirSync(join(directory, 'test-results', 'quality'));
      rmdirSync(join(directory, 'test-results'));
      cleanup();
    }
  });

  it.each([
    true,
    false,
  ])('成功と診断の成果物を保存できた後だけ通知する (成功=%s)', async (passed) => {
    const { output, env, cleanup } = createOutput();
    if (!passed)
      vi.mocked(replaySurfaceMigration).mockRejectedValueOnce(
        new Error('private'),
      );
    try {
      vi.mocked(writeArtifact).mockImplementationOnce(() => {
        expect(readFileSync(output, 'utf8')).toBe('');
      });
      const report = await runSurfaceHistoryCheck(root, env);
      expect(report).toEqual(passed ? { status: 'passed', proof } : failure);
      expectSaved(report);
      expect(readFileSync(output, 'utf8')).toBe('history_written=true\n');
    } finally {
      cleanup();
    }
  });

  it('runner出力への通知に失敗した場合も成功を返さない', async () => {
    const { directory, env, cleanup } = createOutput();
    try {
      await expect(
        runSurfaceHistoryCheck(root, { ...env, GITHUB_OUTPUT: directory }),
      ).resolves.toEqual({
        status: 'failed',
        code: 'SURFACE_HISTORY_OUTPUT_WRITE_FAILED',
      });
      expectSaved({ status: 'passed', proof });
    } finally {
      cleanup();
    }
  });
});
