import { isNil } from 'ramda';

import { legacyKey } from './legacy';
import { validateLegacyExecution } from './legacyExecution';
import { legacySafeResultsSchema } from './legacySafeResults';
import { legacyAppEntries } from './legacySelection';
import { verificationReportSchema } from './verificationSchema';

import type { LegacyProject } from '../../e2e/fixtures/legacySchema';
import type { LegacyManifest } from './legacy';
import type { LegacyExecution } from './legacyExecutionSchema';
import type {
  VerificationStageResult,
  VerificationTestResult,
} from './verificationSchema';

// 任意注釈は既存経路に残し、実行の成否を変える注釈だけを多重集合として比較する。
const controlAnnotationIdentity = (
  annotations: VerificationTestResult['annotations'],
) =>
  JSON.stringify(
    annotations
      .filter(({ type }) =>
        ['skip', 'fixme', 'fail', 'only', 'todo'].includes(type),
      )
      .map(({ type, description }) =>
        JSON.stringify([type, description ?? null]),
      )
      .sort(),
  );

/** 収集証明を通したreceiptの実行行を、正本と共通reportに再照合する。 */
export const validateCiLegacyResults = (input: {
  legacy: LegacyManifest;
  execution: LegacyExecution;
  scope: readonly LegacyProject[];
  stages: VerificationStageResult[];
}) => {
  if (validateLegacyExecution(input).issues.length > 0)
    throw new Error('legacy実行正本がcatalogと一致しません。');
  const expectedStages = input.scope.map((project) => `app-${project}`);
  if (
    input.stages.length !== expectedStages.length ||
    new Set(input.stages.map(({ context }) => context.stageId)).size !==
      expectedStages.length ||
    input.stages.some(
      ({ context }) => !expectedStages.includes(context.stageId),
    )
  )
    throw new Error('legacy stageの割当projectが一致しません。');
  const entries = legacyAppEntries(input.legacy);
  const rows = input.stages.flatMap((stage) => {
    const project = input.scope.find(
      (value) => stage.context.stageId === `app-${value}`,
    );
    if (isNil(project) || isNil(stage.legacyResults))
      throw new Error('legacy stageの実行結果がありません。');
    const results = legacySafeResultsSchema.parse(stage.legacyResults);
    const projectKeys = new Set(
      entries
        .filter((entry) => entry.project === project)
        .map(({ key }) => key),
    );
    const expectedKeys = input.execution.entries
      .filter(
        ({ key, disposition }) =>
          projectKeys.has(key) && disposition !== 'deferred-live',
      )
      .map(({ key }) => key);
    const keys = new Set(results.map(({ key }) => key));
    if (
      keys.size !== expectedKeys.length ||
      expectedKeys.some((key) => !keys.has(key))
    )
      throw new Error('legacy結果の割当集合が一致しません。');
    const report = verificationReportSchema.parse(stage.report);
    const reported = new Map(
      report.tests.map((test) => [legacyKey('app', test), test]),
    );
    if (
      report.profile !== 'app' ||
      reported.size !== results.length ||
      report.tests.length !== results.length
    )
      throw new Error('legacy結果と共通reportの集合が一致しません。');
    for (const row of results) {
      const test = reported.get(row.key);
      const attempt = test?.results[0];
      if (
        isNil(test) ||
        isNil(attempt) ||
        test.project !== project ||
        test.results.length !== 1 ||
        attempt.status !== row.status ||
        test.expectedStatus !== row.expectedStatus ||
        controlAnnotationIdentity(test.annotations) !==
          controlAnnotationIdentity(row.annotations) ||
        controlAnnotationIdentity(attempt.annotations) !==
          controlAnnotationIdentity(row.annotations)
      )
        throw new Error('legacy結果と共通reportの状態が一致しません。');
    }
    return results;
  });
  const scopeKeys = new Set(
    entries
      .filter(({ project }) => input.scope.some((value) => value === project))
      .map(({ key }) => key),
  );
  const checked = validateLegacyExecution({
    legacy: {
      ...input.legacy,
      tests: input.legacy.tests.filter(({ key }) => scopeKeys.has(key)),
      registered: input.legacy.registered.filter(({ key }) =>
        scopeKeys.has(key),
      ),
    },
    execution: {
      ...input.execution,
      entries: input.execution.entries.filter(({ key }) => scopeKeys.has(key)),
    },
    results: rows,
  });
  if (checked.issues.length > 0)
    throw new Error('legacy実行結果が正本と一致しません。');
  return rows;
};
