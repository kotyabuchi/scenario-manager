import { isNil } from 'ramda';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { readArtifact } from './ledgerArtifacts';
import { runIntegrationEnvironment } from './runIntegrationCheck';
import { runIsolatedCheck } from './runIsolatedCheck';
import { runLegacy } from './runLegacy';
import { runStorybookVerification } from './runStorybookVerification';
import { validateScheduleCheckEvidence } from './scheduleCheckEvidence';
import {
  prepareVerificationStage,
  verificationStagePath,
} from './verificationContext';
import { hasReleasedStageResources } from './verificationRelease';
import { verificationReportSchema } from './verificationSchema';

import { relative } from 'node:path';

import type { prepareVerification } from './prepareVerification';
import type {
  PlaywrightRunnerSelection,
  RunnerSelection,
  VitestRunnerSelection,
} from './runnerSelection';
import type { VerificationStageHooks } from './verificationContext';
import type {
  VerificationContext,
  VerificationStageResult,
} from './verificationSchema';

type Preparation = Pick<
  Awaited<ReturnType<typeof prepareVerification>>,
  'plan' | 'inputs' | 'scheduleExpected' | 'integrationExpected'
>;
type RootContext = Omit<VerificationContext, 'stageId'>;

/** 全stageを先に確保し、未起動・途中停止したstageも結果から消さない。 */
export const runVerificationStages = async (input: {
  root: string;
  prepared: Preparation;
  context: RootContext;
  signal: AbortSignal;
  checkpoint: VerificationStageHooks['checkpoint'];
  selections?: readonly RunnerSelection[];
  continueAfterFailure?: boolean;
}) => {
  const { root, prepared, signal, checkpoint } = input;
  const definitions = [
    { id: 'integration', profile: 'integration', kind: 'integration' as const },
    { id: 'storybook', profile: 'storybook', kind: 'storybook' as const },
    { id: 'isolated', profile: 'isolated', kind: 'schedule' as const },
    ...legacyProjectSchema.options.map((project) => ({
      id: `app-${project}`,
      profile: 'app',
      kind: 'legacy' as const,
      project,
    })),
  ];
  const selectedDefinitions = definitions.filter((definition) =>
    [...prepared.plan.requirements, ...prepared.plan.allowedExtraTests].some(
      (entry) =>
        entry.profile === definition.profile &&
        (!('project' in definition) ||
          entry.test.project === definition.project),
    ),
  );
  const integrationSelection = input.selections?.find(
    (selection): selection is VitestRunnerSelection =>
      selection.kind === 'vitest' &&
      selection.expected.profile === 'integration',
  );
  const playwrightSelectionFor = (profile: string) =>
    input.selections?.find(
      (selection): selection is PlaywrightRunnerSelection =>
        selection.kind === 'playwright' &&
        selection.expected.profile === profile,
    );
  const stages: VerificationStageResult[] = selectedDefinitions.map(
    (definition) => {
      const context = { ...input.context, stageId: definition.id };
      prepareVerificationStage(root, context);
      const matches = (
        entry:
          | Preparation['plan']['requirements'][number]
          | Preparation['plan']['allowedExtraTests'][number],
      ) =>
        entry.profile === definition.profile &&
        (!('project' in definition) ||
          entry.test.project === definition.project);
      const requiredKeys = prepared.plan.requirements
        .filter(matches)
        .map(({ key }) => key);
      const extraKeys = prepared.plan.allowedExtraTests
        .filter(matches)
        .map(({ key }) => key);
      return {
        context,
        requiredKeys,
        extraKeys,
        report: null,
        exitCode: null,
        signal: null,
        evidence: {
          kind: definition.kind,
          context,
          checkedKeys: [...requiredKeys, ...extraKeys],
          result: { issues: [{ code: 'STAGE_NOT_RUN' }], counts: {} },
        },
        cleanup: null,
        processCleanup: { exited: false, errorCount: 0 },
      };
    },
  );
  const runs: { stageId: string; runId: string | null; status: string }[] = [];
  const stageFor = (id: string) => {
    const stage = stages.find(({ context }) => context.stageId === id);
    if (isNil(stage)) throw new Error('予定したstageがありません。');
    return stage;
  };
  const hooksFor = (
    stage: VerificationStageResult,
  ): VerificationStageHooks => ({
    context: stage.context,
    signal,
    checkpoint: (phase) => checkpoint(`${stage.context.stageId}:${phase}`),
    onExit: ({ exitCode, signal: exitSignal }) => {
      stage.exitCode = exitCode;
      stage.signal = exitSignal;
      stage.processCleanup.exited = true;
    },
  });
  const readReport = (stage: VerificationStageResult) => {
    try {
      const filename =
        stage.evidence.kind === 'integration'
          ? 'vitest.json'
          : 'playwright.json';
      const content = readArtifact(
        root,
        relative(root, verificationStagePath(root, stage.context, filename)),
      );
      stage.report = isNil(content) ? null : JSON.parse(content);
    } catch {
      stage.report = null;
    }
  };
  const announce = (id: string) => {
    signal.throwIfAborted();
    try {
      process.stderr.write(
        `[e2e-verify] ${JSON.stringify({ stage: id, verificationId: input.context.verificationId })}\n`,
      );
    } catch {
      /* 表示失敗で所有環境の後始末を妨げない。 */
    }
  };
  try {
    if (stages.some(({ context }) => context.stageId === 'integration')) {
      const integration = stageFor('integration');
      announce('integration');
      const integrationResult = await runIntegrationEnvironment(
        root,
        prepared.integrationExpected,
        hooksFor(integration),
        integrationSelection,
      );
      readReport(integration);
      integration.cleanup = integrationResult.environment?.cleanup ?? null;
      if (!isNil(integrationResult.evidence))
        integration.evidence.result = integrationResult.evidence;
      runs.push({
        stageId: 'integration',
        runId: integrationResult.runId,
        status: integrationResult.status,
      });
      if (integrationResult.status !== 'passed') {
        integration.processCleanup.errorCount++;
        if (
          !input.continueAfterFailure ||
          !hasReleasedStageResources(integration)
        )
          return { stages, runs };
      }
    }

    if (stages.some(({ context }) => context.stageId === 'storybook')) {
      const storybook = stageFor('storybook');
      announce('storybook');
      const storybookResult = await runStorybookVerification(
        root,
        hooksFor(storybook),
        playwrightSelectionFor('storybook'),
      );
      readReport(storybook);
      storybook.processCleanup = storybookResult.processCleanup;
      const storyReport = verificationReportSchema.safeParse(storybook.report);
      if (storyReport.success)
        storybook.evidence.result = {
          issues:
            storybookResult.status === 'passed'
              ? []
              : [{ code: 'STORYBOOK_FAILED' }],
          counts: {
            expected: storybook.requiredKeys.length,
            tests: storyReport.data.tests.length,
            passed: storyReport.data.tests.filter(
              (test) =>
                test.outcome === 'expected' &&
                test.results.length === 1 &&
                test.results.every(
                  (attempt) =>
                    attempt.status === 'passed' &&
                    attempt.retry === 0 &&
                    attempt.errorCount === 0,
                ),
            ).length,
          },
        };
      runs.push({
        stageId: 'storybook',
        runId: null,
        status: storybookResult.status,
      });
      if (
        storybookResult.status !== 'passed' &&
        (!input.continueAfterFailure || !hasReleasedStageResources(storybook))
      )
        return { stages, runs };
    }

    if (stages.some(({ context }) => context.stageId === 'isolated')) {
      const isolated = stageFor('isolated');
      announce('isolated');
      const isolatedSelection = playwrightSelectionFor('isolated');
      const isolatedResult = await runIsolatedCheck(root, {
        stage: 'schedule-browser',
        receipt: 'test-results/quality/schedule-check.json',
        label: 'schedule-check',
        config: 'playwright.isolated.config.ts',
        verification: hooksFor(isolated),
        ...(isolatedSelection ? { selection: isolatedSelection } : {}),
        validate: (value) =>
          validateScheduleCheckEvidence({
            ...value,
            expected: prepared.scheduleExpected,
          }),
      });
      readReport(isolated);
      isolated.cleanup = isolatedResult.environment?.cleanup ?? null;
      if (!isNil(isolatedResult.evidence))
        isolated.evidence.result = isolatedResult.evidence;
      runs.push({
        stageId: 'isolated',
        runId: isolatedResult.runId,
        status: isolatedResult.status,
      });
      if (isolatedResult.status !== 'passed') {
        isolated.processCleanup.errorCount++;
        if (!input.continueAfterFailure || !hasReleasedStageResources(isolated))
          return { stages, runs };
      }
    }

    if (stages.some(({ context }) => context.stageId.startsWith('app-'))) {
      announce('app');
      const legacy = await runLegacy(root, [], (project) =>
        hooksFor(stageFor(`app-${project}`)),
      );
      for (const project of legacy.projects) {
        const stage = stageFor(`app-${project.project}`);
        readReport(stage);
        stage.cleanup = project.environment.cleanup;
        stage.evidence.result = {
          issues:
            project.status === 'passed' && legacy.status === 'passed'
              ? []
              : [{ code: 'LEGACY_FAILED' }],
          counts: { total: project.results?.length ?? 0 },
          resultsChecked: legacy.status === 'passed' && !isNil(legacy.results),
        };
        if (project.status !== 'passed') stage.processCleanup.errorCount++;
        runs.push({
          stageId: stage.context.stageId,
          runId: project.runId ?? null,
          status: project.status,
        });
      }
    }
  } catch {
    // 個別ownerのfinally完了後に到達する。未起動行も残して共通checkerへ渡す。
  }
  return { stages, runs };
};
