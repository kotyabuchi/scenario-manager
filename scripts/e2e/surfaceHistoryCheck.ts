import { isNil } from 'ramda';

import { resolveGitCommit } from './gitObjects';
import { writeArtifact } from './ledgerArtifacts';
import { ARTIFACTS } from './staticGate';
import { readSurfaceMigrationHistoryAtRevision } from './surfaceGate';
import { assertSurfaceMigrationHistoryProof } from './surfaceMigrationHistory';
import { replaySurfaceMigration } from './surfaceMigrationReplay';
import { readSurfaceReplayDiagnostic } from './surfaceReplayFailure';
import { prepareVerificationDirectory } from './verificationContext';

import { randomBytes } from 'node:crypto';
import { closeSync, constants, openSync, writeFileSync } from 'node:fs';
import { realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { SurfaceMigrationHistoryProof } from './surfaceMigrationHistory';
import type { SurfaceReplayDiagnostic } from './surfaceReplayFailure';

const ARTIFACT_PATH = 'test-results/quality/surface-history-check.json';

type SurfaceHistoryFailure = {
  status: 'failed';
  code:
    | 'SURFACE_HISTORY_CHECK_FAILED'
    | 'SURFACE_HISTORY_INTERRUPTED'
    | 'SURFACE_HISTORY_ARTIFACT_WRITE_FAILED'
    | 'SURFACE_HISTORY_OUTPUT_WRITE_FAILED';
  surfaceReplay?: SurfaceReplayDiagnostic;
};
type SurfaceHistoryResult =
  | { status: 'passed'; proof: SurfaceMigrationHistoryProof }
  | SurfaceHistoryFailure;

const failed = (
  code: SurfaceHistoryFailure['code'],
  surfaceReplay?: SurfaceReplayDiagnostic,
): SurfaceHistoryFailure => ({
  status: 'failed',
  code,
  ...(isNil(surfaceReplay) ? {} : { surfaceReplay }),
});

const markHistoryWritten = (env: NodeJS.ProcessEnv) => {
  if (env.GITHUB_ACTIONS !== 'true') return;
  const output = env.GITHUB_OUTPUT;
  if (!output) throw new Error('履歴再生のrunner出力がありません');
  // ci.ts と同じくrunnerが作成済みの出力だけを追記モードで開く。
  const fd = openSync(
    output,
    constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    writeFileSync(fd, 'history_written=true\n');
  } finally {
    closeSync(fd);
  }
};

/** 固定履歴だけを再生する。現在のイベントの初回承認やplannerの代替にはしない。 */
export const runSurfaceHistoryCheck = async (
  root = process.cwd(),
  env = process.env,
): Promise<SurfaceHistoryResult> => {
  const controller = new AbortController();
  const { signal } = controller;
  const interrupt = () => controller.abort();
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', interrupt);
  try {
    let report: SurfaceHistoryResult;
    try {
      const physicalRoot = await realpath(root);
      const head = resolveGitCommit(physicalRoot, 'HEAD');
      const { introduced, baseline } = readSurfaceMigrationHistoryAtRevision(
        physicalRoot,
        head,
        ARTIFACTS.baseline,
      );
      const directory = join(
        prepareVerificationDirectory(
          physicalRoot,
          randomBytes(6).toString('hex'),
        ),
        'surface-history',
      );
      signal.throwIfAborted();
      const proof = assertSurfaceMigrationHistoryProof(
        await replaySurfaceMigration({ root: physicalRoot, directory, signal }),
        introduced,
        baseline,
      );
      signal.throwIfAborted();
      if (resolveGitCommit(physicalRoot, 'HEAD') !== head)
        throw new Error('履歴再生中にHEADが変更されました');
      report = { status: 'passed', proof };
    } catch (error) {
      report = failed(
        signal.aborted
          ? 'SURFACE_HISTORY_INTERRUPTED'
          : 'SURFACE_HISTORY_CHECK_FAILED',
        readSurfaceReplayDiagnostic(error),
      );
    }
    try {
      writeArtifact(
        root,
        ARTIFACT_PATH,
        `${JSON.stringify(report, null, 2)}\n`,
      );
    } catch {
      return failed('SURFACE_HISTORY_ARTIFACT_WRITE_FAILED');
    }
    try {
      markHistoryWritten(env);
    } catch {
      return failed('SURFACE_HISTORY_OUTPUT_WRITE_FAILED');
    }
    return report;
  } finally {
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', interrupt);
  }
};

const entry = process.argv[1];
if (!isNil(entry) && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const report = await runSurfaceHistoryCheck().catch(() =>
    failed('SURFACE_HISTORY_CHECK_FAILED'),
  );
  if (report.status === 'failed') process.exitCode = 1;
  // 閉じたstdoutのerrorも生のstackとして出さない。
  process.stdout.on('error', () => {
    process.exitCode = 1;
  });
  try {
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } catch {
    process.exitCode = 1;
  }
}
