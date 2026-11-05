import { isNil } from 'ramda';
import { z } from 'zod';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';
import {
  readEnvironmentCredentials,
  writeEnvironmentCredentials,
} from './environmentCredentials';
import { probeEnvironment } from './environmentProbe';
import { validateIntegrationEvidence } from './evidence/vitest';
import { readArtifact, writeArtifact } from './ledgerArtifacts';

import { existsSync } from 'node:fs';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  unlink,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

import type { EnvironmentProbeProgress } from './environmentProbe';
import type { IntegrationExpectation } from './integrationSchema';

export const INTEGRATION_RECEIPT =
  'test-results/quality/integration-check.json';
const runtimeSchema = z.object({ dockerHost: z.string() });

/** Nextサーバーを起動せず、専用DB・Vitest・journalを所有し、失敗後も後始末を待つ。 */
export const runIntegrationEnvironment = async (
  root: string,
  expected: IntegrationExpectation[],
) => {
  const worktreeRoot = await realpath(root);
  let phase = 'environment';
  let environment: Awaited<ReturnType<typeof probeEnvironment>> | null = null;
  const state: {
    progress: EnvironmentProbeProgress | null;
    evidence: ReturnType<typeof validateIntegrationEvidence> | null;
  } = { progress: null, evidence: null };
  let status: 'running' | 'passed' | 'failed' = 'running';
  const save = () =>
    writeArtifact(
      worktreeRoot,
      INTEGRATION_RECEIPT,
      `${JSON.stringify({ schemaVersion: 1, stage: 'schedule-integration', status, phase, environment, environmentProgress: state.progress, evidence: state.evidence }, null, 2)}\n`,
    );
  const announce = (progressPhase = phase) => {
    try {
      process.stderr.write(
        `[integration-check] ${JSON.stringify({ phase: progressPhase, runId: state.progress?.runId })}\n`,
      );
    } catch {
      // 表示先の失敗でも所有資源の後始末は続ける。
    }
  };
  const begin = (next: string) => {
    phase = next;
    save();
    announce();
  };
  save();
  try {
    environment = await probeEnvironment(
      worktreeRoot,
      undefined,
      (progress) => {
        state.progress = progress;
        save();
        announce(progress.phase);
      },
      async (manifest, signal) => {
        begin('credentials');
        const runtime = runtimeSchema.parse(
          JSON.parse(
            await readFile(join(manifest.workdir, 'runtime.json'), 'utf8'),
          ),
        );
        const env = localCommandEnvironment(process.env, runtime.dockerHost);
        const raw = await runLocalCommand(
          'supabase',
          ['status', '-o', 'json', '--workdir', manifest.workdir],
          { cwd: worktreeRoot, env, signal },
        );
        const file = writeEnvironmentCredentials(manifest, raw);
        try {
          const connection = readEnvironmentCredentials(worktreeRoot, file);
          const parent = join(worktreeRoot, 'test-results', 'integration');
          if (!existsSync(parent)) await mkdir(parent);
          if (
            (await lstat(parent)).isSymbolicLink() ||
            (await realpath(parent)) !== parent
          )
            throw new Error('integration結果の親directoryが不正です。');
          await mkdir(join(parent, manifest.runId));
          const cli = createRequire(join(worktreeRoot, 'package.json')).resolve(
            'vitest/vitest.mjs',
          );
          begin('tests');
          let runnerFailed = false;
          try {
            await runLocalCommand(
              'node',
              [cli, 'run', '--config', 'vitest.integration.verified.config.ts'],
              {
                cwd: worktreeRoot,
                env: {
                  ...env,
                  SCENARIO_E2E_RUN_ID: manifest.runId,
                  SCENARIO_E2E_CREDENTIALS: file,
                },
                signal,
                log: join(manifest.workdir, 'integration.private.log'),
              },
            );
          } catch {
            runnerFailed = true;
          }
          begin('evidence');
          const output = readArtifact(
            worktreeRoot,
            `test-results/integration/${manifest.runId}/vitest.json`,
          );
          if (isNil(output)) throw new Error('integration結果がありません。');
          const directory = join(manifest.workdir, 'fixtures');
          const journals: unknown[] = [];
          for (const name of await readdir(directory)) {
            const candidate = join(directory, name, 'manifest.json');
            if (
              !/^[a-f0-9]{64}$/.test(name) ||
              (await realpath(candidate)) !== candidate
            )
              throw new Error('fixture journalのpathが不正です。');
            const contents = readArtifact(
              worktreeRoot,
              relative(worktreeRoot, candidate),
            );
            if (isNil(contents))
              throw new Error('fixture journalがありません。');
            journals.push(JSON.parse(contents));
          }
          state.evidence = validateIntegrationEvidence({
            expected,
            report: JSON.parse(output),
            journals,
            lease: connection.lease,
          });
          if (state.evidence.issues.length > 0)
            throw new Error('integrationの実行証跡が一致しません。');
          if (runnerFailed)
            throw new Error('integration runnerが失敗しました。');
        } finally {
          // workerとそのfixture cleanupが終了してから秘密fileを削除し、probeがstackを回収する。
          await unlink(file);
        }
      },
    );
    status =
      environment.passed &&
      !isNil(state.evidence) &&
      state.evidence.issues.length === 0
        ? 'passed'
        : 'failed';
    if (status === 'passed') phase = 'complete';
  } catch {
    status = 'failed';
  }
  save();
  return {
    status,
    phase,
    runId: environment?.runId ?? state.progress?.runId ?? null,
    evidence: state.evidence,
  };
};
