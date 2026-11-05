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
import { APP_PORT, withIsolatedApp } from './isolatedApp';
import { readArtifact, writeArtifact } from './ledgerArtifacts';
import { playwrightSourceMapOptions } from './playwrightSourceMaps';

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
import type { EnvironmentLease } from './environmentSchema';
import type { AppProgress } from './isolatedApp';

type IsolatedCheckOptions<Evidence> = {
  stage: string;
  receipt: string;
  label: string;
  config: string;
  validate: (input: {
    report: unknown;
    journals: unknown[];
    lease: EnvironmentLease;
  }) => Evidence;
};
const runtimeSchema = z.object({ dockerHost: z.string() });

/** 専用DB・本番app・browserの所有と後始末を共通化する。業務結果は呼出側で照合する。 */
export const runIsolatedCheck = async <Evidence extends { issues: unknown[] }>(
  root: string,
  options: IsolatedCheckOptions<Evidence>,
) => {
  const worktreeRoot = await realpath(root);
  let phase = 'environment';
  let environment: Awaited<ReturnType<typeof probeEnvironment>> | null = null;
  const state: {
    evidence: Evidence | null;
    progress: EnvironmentProbeProgress | null;
    appProgress: AppProgress | null;
  } = { evidence: null, progress: null, appProgress: null };
  let status: 'running' | 'passed' | 'failed' = 'running';
  const save = () =>
    writeArtifact(
      worktreeRoot,
      options.receipt,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          stage: options.stage,
          status,
          phase,
          environment,
          evidence: state.evidence,
          environmentProgress: state.progress,
          appProgress: state.appProgress,
        },
        null,
        2,
      )}\n`,
    );
  const announce = (value: { phase: string; runId: string | undefined }) => {
    try {
      process.stderr.write(`[${options.label}] ${JSON.stringify(value)}\n`);
    } catch {
      // 表示先の失敗でもreceipt保存と所有環境のcleanupは継続する。
    }
  };
  const begin = (next: string) => {
    phase = next;
    save();
    announce({ phase, runId: state.progress?.runId });
  };
  save();
  try {
    environment = await probeEnvironment(
      worktreeRoot,
      undefined,
      (progress) => {
        state.progress = progress;
        save();
        announce({ phase: progress.phase, runId: progress.runId });
      },
      async (manifest, signal) => {
        begin('credentials');
        const runtime = runtimeSchema.parse(
          JSON.parse(
            await readFile(join(manifest.workdir, 'runtime.json'), 'utf8'),
          ),
        );
        const raw = await runLocalCommand(
          'supabase',
          ['status', '-o', 'json', '--workdir', manifest.workdir],
          {
            cwd: worktreeRoot,
            env: localCommandEnvironment(process.env, runtime.dockerHost),
            signal,
          },
        );
        const file = writeEnvironmentCredentials(manifest, raw);
        try {
          const connection = readEnvironmentCredentials(worktreeRoot, file);
          begin('app');
          await withIsolatedApp(
            connection,
            signal,
            async (context) => {
              const parent = join(worktreeRoot, 'test-results', 'isolated');
              if (!existsSync(parent)) await mkdir(parent);
              if (
                (await lstat(parent)).isSymbolicLink() ||
                (await realpath(parent)) !== parent
              )
                throw new Error('browser結果の親directoryが不正です。');
              // 同じrun IDの古い成功を読み取らない。
              await mkdir(join(parent, manifest.runId));
              begin('browser');
              const cli = createRequire(
                join(worktreeRoot, 'package.json'),
              ).resolve('@playwright/test/cli');
              const sourceMaps = await playwrightSourceMapOptions(cli);
              let browserFailed = false;
              try {
                await runLocalCommand(
                  'node',
                  [...sourceMaps.args, cli, 'test', '--config', options.config],
                  {
                    cwd: worktreeRoot,
                    env: {
                      ...context.env,
                      ...sourceMaps.env,
                      SCENARIO_E2E_CREDENTIALS: file,
                    },
                    signal: context.signal,
                    log: join(manifest.workdir, 'fixture-browser.private.log'),
                  },
                );
              } catch {
                browserFailed = true;
              }
              begin('evidence');
              const output = readArtifact(
                worktreeRoot,
                `test-results/isolated/${manifest.runId}/playwright.json`,
              );
              if (isNil(output)) throw new Error('browser結果がありません。');
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
              state.evidence = options.validate({
                report: JSON.parse(output),
                journals,
                lease: connection.lease,
              });
              if (state.evidence.issues.length > 0)
                throw new Error('fixtureの実行証跡が一致しません。');
              if (browserFailed)
                throw new Error('browser runnerが失敗しました。');
            },
            (progress) => {
              state.appProgress = progress;
              begin(progress.phase === 'operation' ? 'app' : progress.phase);
            },
          );
        } finally {
          // app・workerの終了とfixture cleanupを待ってから、このrunで作成した秘密fileを破棄する。
          await unlink(file);
        }
      },
      [APP_PORT],
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
