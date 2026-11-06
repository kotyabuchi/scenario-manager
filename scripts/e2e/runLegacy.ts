import { isNil } from 'ramda';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { discover } from './discover';
import { summarizeEnvironmentFailure } from './environmentDiagnostic';
import { readArtifact, writeArtifact } from './ledgerArtifacts';
import { buildLegacy } from './legacy';
import { verifyLegacyOrigins } from './legacyOrigin';
import { runLegacyProject } from './legacyProjectRun';
import { aggregateLegacyResults } from './legacyResults';
import {
  createLegacySelection,
  validateLegacyDiscovery,
} from './legacySelection';
import { assertLegacySources, captureLegacySources } from './legacySourceGuard';

import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { LegacyProject } from '../../e2e/fixtures/legacySchema';
import type { LegacyExecutionResult } from './legacyExecutionSchema';
import type { LegacyProgress } from './legacyProjectRun';
import type { VerificationStageHooks } from './verificationContext';

const RECEIPT = 'test-results/quality/legacy-run.json';
const DISCOVERY = 'test-results/quality/legacy-run-discovery.json';
const LOCAL_VARIABLES = [
  'SCENARIO_E2E_RUN_ID',
  'SCENARIO_E2E_CREDENTIALS',
  'SCENARIO_E2E_LEGACY_CONTEXT',
  'SCENARIO_E2E_LEGACY_PROJECT',
];

/** 指定projectだけの診断実行はfull-suite成功として扱わない。 */
export const parseLegacyArguments = (args: string[]): LegacyProject[] => {
  if (args.length === 0) return [...legacyProjectSchema.options];
  if (args.length !== 2 || args[0] !== '--project')
    throw new Error('使用法: runLegacy.ts [--project <project>]');
  return [legacyProjectSchema.parse(args[1])];
};

/** 現在の登録を照合した上で、4 projectを別の所有環境で順に実行する。 */
export const runLegacy = async (
  root: string,
  args: string[] = [],
  verification?: (project: LegacyProject) => VerificationStageHooks,
) => {
  const projects = parseLegacyArguments(args);
  const worktreeRoot = await realpath(root);
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  const state: {
    status: 'running' | 'passed' | 'partial-passed' | 'failed';
    phase: string;
    progress: LegacyProgress | null;
    projects: Awaited<ReturnType<typeof runLegacyProject>>[];
    results: LegacyExecutionResult[] | null;
    failure: ReturnType<typeof summarizeEnvironmentFailure>;
  } = {
    status: 'running',
    phase: 'discovery',
    progress: null,
    projects: [],
    results: null,
    failure: null,
  };
  const save = () =>
    writeArtifact(
      worktreeRoot,
      RECEIPT,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          stage: 'legacy-local',
          requestedProjects: projects,
          ...state,
        },
        null,
        2,
      )}\n`,
    );
  const announce = (progress: LegacyProgress) => {
    state.progress = progress;
    state.phase = progress.phase;
    save();
    try {
      process.stderr.write(`[legacy-local] ${JSON.stringify(progress)}\n`);
    } catch {
      /* 表示先の失敗でも所有環境の後始末は継続する。 */
    }
  };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    save();
    if (LOCAL_VARIABLES.some((key) => !isNil(process.env[key])))
      throw new Error('既存runの環境変数を引き継いだ起動はできません。');
    const read = (file: string): unknown => {
      const content = readArtifact(worktreeRoot, file);
      if (isNil(content)) throw new Error('旧suiteの移行台帳がありません。');
      return JSON.parse(content);
    };
    const legacy = read('e2e/ledger/legacy-tests.generated.json');
    const execution = read('e2e/ledger/legacy-execution.json');
    state.phase = 'origin-proof';
    await verifyLegacyOrigins(worktreeRoot, execution);
    state.phase = 'discovery';
    const sources = captureLegacySources(worktreeRoot, legacy);
    controller.signal.throwIfAborted();
    const currentLegacy = await buildLegacy(worktreeRoot, [
      await discover({
        root: worktreeRoot,
        profile: 'app',
        config: 'playwright.legacy-local.config.ts',
        setupProjects: [],
      }),
    ]);
    assertLegacySources(worktreeRoot, sources);
    const input = { legacy, execution, currentLegacy };
    validateLegacyDiscovery(input);
    // 一部projectの診断でも移行台帳と全projectの登録対応を先に確認する。
    for (const project of legacyProjectSchema.options)
      createLegacySelection({ ...input, project });
    writeArtifact(
      worktreeRoot,
      DISCOVERY,
      `${JSON.stringify(currentLegacy, null, 2)}\n`,
    );
    for (const project of projects) {
      controller.signal.throwIfAborted();
      assertLegacySources(worktreeRoot, sources);
      announce({ project, phase: 'environment' });
      const result = await runLegacyProject(
        worktreeRoot,
        { ...input, project },
        controller.signal,
        announce,
        verification?.(project),
      );
      state.projects.push(result);
      state.phase = 'source-check';
      assertLegacySources(worktreeRoot, sources);
      save();
      // 未回収の所有物がある状態で、次projectの環境を作らない。
      if (result.status !== 'passed')
        throw new Error('legacy projectが失敗しました。');
    }
    controller.signal.throwIfAborted();
    state.phase = 'aggregate';
    if (projects.length === legacyProjectSchema.options.length) {
      state.results = aggregateLegacyResults({
        ...input,
        projects: state.projects,
      });
      state.status = 'passed';
    } else state.status = 'partial-passed';
  } catch (error) {
    // 生のSDKエラーや認証情報を公開receiptへ持ち込まない。
    state.failure = summarizeEnvironmentFailure(
      error,
      state.phase === 'locking',
    );
    state.status = 'failed';
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
  save();
  return state;
};

if (
  !isNil(process.argv[1]) &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  runLegacy(process.cwd(), process.argv.slice(2))
    .then((result) => {
      process.stdout.write(
        `${JSON.stringify({
          status: result.status,
          phase: result.phase,
          failure: result.failure,
          projects: result.projects.map((value) => ({
            project: value.project,
            status: value.status,
            runId: value.runId,
          })),
        })}\n`,
      );
      if (result.status === 'failed') process.exitCode = 1;
    })
    .catch(() => {
      process.stderr.write('legacy-local実行または証跡保存に失敗しました。\n');
      process.exitCode = 1;
    });
}
