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
import { validateFixtureCheckEvidence } from './fixtureCheckEvidence';
import { APP_PORT, withIsolatedApp } from './isolatedApp';
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
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { EnvironmentProbeProgress } from './environmentProbe';

const RECEIPT = 'test-results/quality/fixture-check.json';
const runtimeSchema = z.object({ dockerHost: z.string() });

/** 本番アプリと実browserでfixture基盤だけを検査する。業務caseの証拠ではない。 */
export const runFixtureCheck = async (root: string) => {
  const worktreeRoot = await realpath(root);
  let phase = 'environment';
  let environment: Awaited<ReturnType<typeof probeEnvironment>> | null = null;
  const state: {
    evidence: ReturnType<typeof validateFixtureCheckEvidence> | null;
    progress: EnvironmentProbeProgress | null;
  } = { evidence: null, progress: null };
  let status: 'running' | 'passed' | 'failed' = 'running';
  const save = () =>
    writeArtifact(
      worktreeRoot,
      RECEIPT,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          stage: 'fixture-foundation',
          status,
          phase,
          environment,
          evidence: state.evidence,
          environmentProgress: state.progress,
        },
        null,
        2,
      )}\n`,
    );
  save();
  try {
    environment = await probeEnvironment(
      worktreeRoot,
      undefined,
      (progress) => {
        state.progress = progress;
        process.stderr.write(`[fixture-check] ${JSON.stringify(progress)}\n`);
      },
      async (manifest, signal) => {
        phase = 'credentials';
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
          phase = 'app';
          await withIsolatedApp(connection, signal, async (context) => {
            const parent = join(worktreeRoot, 'test-results', 'isolated');
            if (!existsSync(parent)) await mkdir(parent);
            if (
              (await lstat(parent)).isSymbolicLink() ||
              (await realpath(parent)) !== parent
            )
              throw new Error('browser結果の親directoryが不正です。');
            // 同じrun IDの古い成功を読み取らない。
            await mkdir(join(parent, manifest.runId));
            phase = 'browser';
            const cli = createRequire(
              join(worktreeRoot, 'package.json'),
            ).resolve('@playwright/test/cli');
            let browserFailed = false;
            try {
              await runLocalCommand(
                'node',
                [cli, 'test', '--config', 'playwright.fixture-check.config.ts'],
                {
                  cwd: worktreeRoot,
                  env: { ...context.env, SCENARIO_E2E_CREDENTIALS: file },
                  signal: context.signal,
                  log: join(manifest.workdir, 'fixture-browser.private.log'),
                },
              );
            } catch {
              browserFailed = true;
            }
            phase = 'evidence';
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
            state.evidence = validateFixtureCheckEvidence(
              JSON.parse(output),
              journals,
            );
            if (state.evidence.issues.length > 0)
              throw new Error('fixtureの実行証跡が一致しません。');
            if (browserFailed)
              throw new Error('browser runnerが失敗しました。');
          });
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

const entry = process.argv[1];
if (!isNil(entry) && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const result = await runFixtureCheck(process.cwd());
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === 'passed' ? 0 : 1;
}
