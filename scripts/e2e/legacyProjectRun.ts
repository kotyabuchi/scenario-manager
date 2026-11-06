import { isNil } from 'ramda';
import { z } from 'zod';

import { cleanupFixture } from '../../e2e/fixtures/fixtureCleanup';
import { createFixtureJournal } from '../../e2e/fixtures/fixtureManifest';
import { withLegacyContext } from '../../e2e/fixtures/legacyContext';
import { prepareLegacySeed } from '../../e2e/fixtures/legacySeed';
import { cleanupLegacySessions } from '../../e2e/fixtures/legacySessionCleanup';
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
import { readArtifact } from './ledgerArtifacts';
import { parseLegacyProjectResults } from './legacyResults';
import { createLegacySelection } from './legacySelection';
import { playwrightSourceMapOptions } from './playwrightSourceMaps';

import {
  lstat,
  mkdir,
  readFile,
  realpath,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';

import type { FixtureJournal } from '../../e2e/fixtures/fixtureManifest';
import type {
  FixtureActor,
  FixtureCleanup,
} from '../../e2e/fixtures/fixtureSchema';
import type { LegacyProject } from '../../e2e/fixtures/legacySchema';
import type { LegacyExecutionResult } from './legacyExecutionSchema';
import type { LegacySelectionInput } from './legacySelection';

const runtimeSchema = z.object({ dockerHost: z.string() });

type LegacyProgress = { project: LegacyProject; phase: string; runId?: string };

/** projectごとに空DB・actor・state・本番appを作り、全所有物の後始末まで待つ。 */
export const runLegacyProject = async (
  root: string,
  input: LegacySelectionInput & { project: LegacyProject },
  signal: AbortSignal,
  onProgress?: (value: LegacyProgress) => void,
) => {
  const selection = createLegacySelection(input);
  // 内側で記録済みの再throwだけを識別し、context自身の別の失敗は残す。
  const recordedOperationFailures = new Set<unknown>();
  const isRecordedOperationFailure = (error: unknown): boolean =>
    recordedOperationFailures.has(error) ||
    (error instanceof AggregateError &&
      error.errors.length > 0 &&
      error.errors.every((cause: unknown) =>
        isRecordedOperationFailure(cause),
      ));
  const state: {
    phase: string;
    runId?: string;
    results: LegacyExecutionResult[] | null;
    cleanup: FixtureCleanup | null;
    actor: FixtureActor | null;
    failurePhases: string[];
  } = {
    phase: 'environment',
    results: null,
    cleanup: null,
    actor: null,
    failurePhases: [],
  };
  const progress = (phase: string) => {
    state.phase = phase;
    try {
      onProgress?.({
        project: input.project,
        phase,
        ...(isNil(state.runId) ? {} : { runId: state.runId }),
      });
    } catch {
      // 表示失敗で所有stackの後始末を中断しない。
    }
  };
  const environment = await probeEnvironment(
    root,
    signal,
    (value) => {
      if (!isNil(value.runId)) state.runId = value.runId;
      progress(value.phase);
    },
    async (manifest, environmentSignal) => {
      progress('credentials');
      const runtime = runtimeSchema.parse(
        JSON.parse(
          await readFile(join(manifest.workdir, 'runtime.json'), 'utf8'),
        ),
      );
      const raw = await runLocalCommand(
        'supabase',
        ['status', '-o', 'json', '--workdir', manifest.workdir],
        {
          cwd: root,
          env: localCommandEnvironment(process.env, runtime.dockerHost),
          signal: environmentSignal,
        },
      );
      const credentialsFile = writeEnvironmentCredentials(manifest, raw);
      const failures: unknown[] = [];
      try {
        const connection = readEnvironmentCredentials(root, credentialsFile);
        let journal: FixtureJournal | undefined;
        try {
          progress('seed');
          journal = await createFixtureJournal(connection, {
            project: input.project,
            workerIndex: 0,
            caseId: 'legacy-suite',
            retry: 0,
          });
          const seed = await prepareLegacySeed(connection, journal);
          state.actor = seed.actor.identity;
          await withLegacyContext(
            connection,
            journal,
            seed.actor,
            async (contextFile, context) => {
              const operationFailures: unknown[] = [];
              try {
                await withIsolatedApp(
                  connection,
                  environmentSignal,
                  async (app) => {
                    const parent = join(root, 'test-results', 'legacy');
                    await mkdir(parent, { recursive: true, mode: 0o700 });
                    if (
                      (await lstat(parent)).isSymbolicLink() ||
                      (await realpath(parent)) !== parent
                    )
                      throw new Error('legacy出力directoryが不正です。');
                    const directory = join(parent, manifest.runId);
                    await mkdir(directory, { mode: 0o700 });
                    const listFile = join(directory, 'tests.txt');
                    await writeFile(listFile, selection.testList, {
                      flag: 'wx',
                      mode: 0o600,
                    });
                    progress('browser');
                    const cli = createRequire(
                      join(root, 'package.json'),
                    ).resolve('@playwright/test/cli');
                    const sourceMaps = await playwrightSourceMapOptions(cli);
                    let browserFailed = false;
                    try {
                      await runLocalCommand(
                        'node',
                        [
                          ...sourceMaps.args,
                          cli,
                          'test',
                          '--config',
                          'playwright.legacy-local.config.ts',
                          '--test-list',
                          listFile,
                        ],
                        {
                          cwd: root,
                          env: {
                            ...app.env,
                            ...sourceMaps.env,
                            SCENARIO_E2E_CREDENTIALS: credentialsFile,
                            SCENARIO_E2E_LEGACY_CONTEXT: contextFile,
                            SCENARIO_E2E_LEGACY_PROJECT: input.project,
                          },
                          signal: app.signal,
                          log: join(
                            manifest.workdir,
                            'legacy-browser.private.log',
                          ),
                        },
                      );
                    } catch {
                      browserFailed = true;
                    }
                    progress('evidence');
                    const report = readArtifact(
                      root,
                      relative(root, join(directory, 'playwright.json')),
                    );
                    if (isNil(report))
                      throw new Error('legacy browser結果がありません。');
                    state.results = parseLegacyProjectResults({
                      ...input,
                      report: JSON.parse(report),
                    });
                    if (browserFailed)
                      throw new Error('legacy browser commandが失敗しました。');
                  },
                  (value) => progress(value.phase),
                );
              } catch (error) {
                state.failurePhases.push(state.phase);
                operationFailures.push(error);
              } finally {
                progress('ui-cleanup');
                try {
                  await cleanupLegacySessions(connection, context);
                } catch (error) {
                  state.failurePhases.push(state.phase);
                  operationFailures.push(error);
                }
              }
              if (operationFailures.length > 0) {
                const failure = new AggregateError(
                  operationFailures,
                  'legacy app実行またはUI行の後始末に失敗しました。',
                );
                recordedOperationFailures.add(failure);
                throw failure;
              }
            },
          );
        } catch (error) {
          if (!isRecordedOperationFailure(error))
            state.failurePhases.push(state.phase);
          failures.push(error);
        } finally {
          if (!isNil(journal)) {
            progress('fixture-cleanup');
            try {
              state.cleanup = await cleanupFixture(connection, journal);
              if (state.cleanup.status !== 'complete')
                failures.push(new Error('legacy seedの後始末が不完全です。'));
            } catch (error) {
              state.failurePhases.push(state.phase);
              failures.push(error);
            }
          }
        }
      } catch (error) {
        state.failurePhases.push(state.phase);
        failures.push(error);
      } finally {
        try {
          await unlink(credentialsFile);
        } catch (error) {
          state.failurePhases.push('credentials-cleanup');
          failures.push(error);
        }
      }
      if (failures.length > 0)
        throw new AggregateError(
          failures,
          'legacy projectの実行または後始末に失敗しました。',
        );
    },
    [APP_PORT],
  );
  const passed =
    state.failurePhases.length === 0 &&
    environment.passed &&
    !isNil(state.results) &&
    state.cleanup?.status === 'complete';
  return {
    project: input.project,
    status: passed ? ('passed' as const) : ('failed' as const),
    environment,
    ...state,
  };
};

export type { LegacyProgress };
