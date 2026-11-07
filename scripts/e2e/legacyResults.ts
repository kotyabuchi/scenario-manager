import { isNil } from 'ramda';
import { z } from 'zod';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { discoveryTestSchema } from './discoverySchema';
import { legacyKey, legacyManifestSchema } from './legacy';
import { validateLegacyExecution } from './legacyExecution';
import {
  legacyExecutionResultsSchema,
  legacyExecutionSchema,
} from './legacyExecutionSchema';
import { legacySafeResultsSchema } from './legacySafeResults';
import {
  createLegacySelection,
  legacyAppEntries,
  validateLegacyDiscovery,
} from './legacySelection';
import { readTestTags } from './testTags';

import type { LegacyProject } from '../../e2e/fixtures/legacySchema';
import type { LegacyExecutionResult } from './legacyExecutionSchema';
import type { LegacySelectionInput } from './legacySelection';

// Playwright 1.57は実行時annotationへ宣言位置を付加する。
// 位置の形を検証した後、台帳が定義するtype/descriptionだけへ正規化する。
const annotations = z.array(
  discoveryTestSchema.shape.annotations.element
    .extend({
      location: z
        .strictObject({
          file: z.string().min(1),
          line: z.number().int().positive(),
          column: z.number().int().positive(),
        })
        .optional(),
    })
    .transform(({ type, description }) =>
      typeof description === 'string' ? { type, description } : { type },
    ),
);
const status = discoveryTestSchema.shape.expectedStatus;
const attemptSchema = z.object({
  status,
  retry: z.literal(0),
  errors: z.array(z.unknown()).length(0),
  error: z.never().optional(),
  annotations,
});
const testSchema = z.object({
  projectName: z.string().min(1),
  projectId: z.string().min(1),
  expectedStatus: status,
  status: z.enum(['expected', 'skipped']),
  annotations,
  results: z.array(attemptSchema).length(1),
});
const specSchema = z.object({
  title: z.string().min(1),
  file: z.string().min(1),
  ok: z.literal(true),
  tags: z.array(z.string()).default([]),
  tests: z.array(testSchema).length(1),
});
const suiteSchema = z.object({
  title: z.string(),
  file: z.string().min(1),
  specs: z.array(specSchema),
  get suites(): z.ZodOptional<z.ZodArray<typeof suiteSchema>> {
    return z.array(suiteSchema).optional();
  },
});
const reportSchema = z.object({
  config: z.object({
    projects: z.array(
      z.object({
        name: z.string(),
        id: z.string(),
        retries: z.literal(0),
        repeatEach: z.literal(1),
      }),
    ),
  }),
  suites: z.array(suiteSchema),
  errors: z.array(z.unknown()).length(0),
  stats: z.object({
    expected: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    unexpected: z.literal(0),
    flaky: z.literal(0),
  }),
});
const annotationIdentity = (value: z.infer<typeof annotations>) =>
  JSON.stringify(value.map((entry) => JSON.stringify(entry)).sort());

const checkProject = (
  input: LegacySelectionInput,
  results: LegacyExecutionResult[],
) => {
  const selection = createLegacySelection(input);
  const legacy = legacyManifestSchema.parse(input.legacy);
  const execution = legacyExecutionSchema.parse(input.execution);
  const keys = new Set(selection.keys);
  const validation = validateLegacyExecution({
    legacy: {
      ...legacy,
      tests: legacy.tests.filter((entry) => keys.has(entry.key)),
      registered: legacy.registered.filter((entry) => keys.has(entry.key)),
    },
    execution: {
      ...execution,
      entries: execution.entries.filter((entry) => keys.has(entry.key)),
    },
    results,
  });
  if (validation.issues.length > 0)
    throw new Error('project結果が旧test実行先と一致しません。');
};

/**
 * 公式JSON reportの一project分だけを検査する。fingerprintはreportに存在しないため、
 * 現在のguard付きdiscoveryと旧台帳の一致を確認してから付与する。
 */
export const parseLegacyProjectResults = (
  input: LegacySelectionInput & { report: unknown },
): LegacyExecutionResult[] => {
  const selection = createLegacySelection(input);
  const report = reportSchema.parse(input.report);
  const execution = legacyExecutionSchema.parse(input.execution);
  const dispositions = new Map(
    execution.entries.map((entry) => [entry.key, entry]),
  );
  const projects = report.config.projects.filter(
    (project) => project.name === input.project,
  );
  const project = projects[0];
  if (projects.length !== 1 || isNil(project))
    throw new Error('reportのproject設定が一致しません。');
  const entries = new Map(selection.entries.map((entry) => [entry.key, entry]));
  const results: LegacyExecutionResult[] = [];
  let expected = 0;
  let skipped = 0;
  const visit = (
    suite: z.infer<typeof suiteSchema>,
    titles: string[],
    file: string,
  ) => {
    if (suite.file !== file)
      throw new Error('reportのsuite/fileが一致しません。');
    for (const spec of suite.specs) {
      if (spec.file !== file)
        throw new Error('reportのspec/fileが一致しません。');
      const test = spec.tests[0];
      const attempt = test?.results[0];
      if (
        isNil(test) ||
        isNil(attempt) ||
        test.projectName !== input.project ||
        test.projectId !== project.id
      )
        throw new Error('reportに別projectまたは不正なattemptがあります。');
      const key = legacyKey('app', {
        project: input.project,
        file: `e2e/${file}`,
        titlePath: [...titles, spec.title],
        repeatEachIndex: 0,
      });
      const entry = entries.get(key);
      if (isNil(entry))
        throw new Error('reportに未選択/未知/deferredの結果があります。');
      if (
        annotationIdentity(test.annotations) !==
          annotationIdentity(attempt.annotations) ||
        (attempt.status === 'skipped'
          ? test.status !== 'skipped'
          : test.status !== 'expected')
      )
        throw new Error(
          'reportの最終状態またはannotationがattemptと一致しません。',
        );
      if (test.status === 'expected') expected += 1;
      else skipped += 1;
      const disposition = dispositions.get(key);
      // Playwright 1.57の公式JSON reporterはタグ先頭の@を除去する。
      const tags = readTestTags(spec.tags.map((tag) => `@${tag}`));
      if (disposition?.disposition === 'replacement') {
        if (
          isNil(tags) ||
          tags.caseId !== disposition.replacement.caseId ||
          tags.variant !== disposition.replacement.variant ||
          tags.binding !== disposition.replacement.binding
        )
          throw new Error(
            'replacement結果のcase/variant/bindingが一致しません。',
          );
      } else if (!isNil(tags)) {
        throw new Error('未移行legacyの結果に予約caseタグがあります。');
      }
      results.push({
        key,
        ...(disposition?.disposition === 'replacement'
          ? { originFingerprint: disposition.fingerprint }
          : {}),
        fingerprint: entry.fingerprint,
        status: attempt.status,
        expectedStatus: test.expectedStatus,
        annotations: test.annotations,
      });
    }
    for (const child of suite.suites ?? [])
      visit(child, [...titles, child.title], file);
  };
  for (const suite of report.suites) visit(suite, [], suite.file);
  if (
    report.stats.expected !== expected ||
    report.stats.skipped !== skipped ||
    expected + skipped !== selection.keys.length
  )
    throw new Error('reportのstats/総件数が選択集合と一致しません。');
  checkProject(input, results);
  return results;
};

/** 部分project成功を全体成功にせず、全projectの非deferred登録を照合する。 */
export const aggregateLegacyResults = (
  input: Omit<LegacySelectionInput, 'project'> & {
    projects: { project: string; results: unknown }[];
  },
): LegacyExecutionResult[] => {
  const { legacy } = validateLegacyDiscovery(input);
  const execution = legacyExecutionSchema.parse(input.execution);
  const expected = new Set(
    legacyAppEntries(legacy).map((entry) => entry.project),
  );
  const seen = new Set<string>();
  const results: LegacyExecutionResult[] = [];
  for (const value of input.projects) {
    if (seen.has(value.project) || !expected.has(value.project))
      throw new Error('集約projectが未知または重複しています。');
    seen.add(value.project);
    const partial = legacyExecutionResultsSchema.parse(value.results);
    checkProject({ ...input, project: value.project }, partial);
    results.push(...partial);
  }
  if (seen.size !== expected.size)
    throw new Error('全projectの結果が揃っていません。');
  const validation = validateLegacyExecution({ legacy, execution, results });
  if (validation.issues.length > 0)
    throw new Error('全体結果が旧test実行先と一致しません。');
  return results;
};

/** 全登録を照合した上で、割当projectの実結果だけを安全な公開行へ投影する。 */
export const aggregateLegacyScopedResults = (
  input: Omit<LegacySelectionInput, 'project'> & {
    scope: readonly LegacyProject[];
    projects: { project: string; results: unknown }[];
  },
): LegacyExecutionResult[] => {
  const scope = z.array(legacyProjectSchema).min(1).parse(input.scope);
  if (new Set(scope).size !== scope.length)
    throw new Error('割当projectが重複しています。');
  validateLegacyDiscovery(input);
  const execution = legacyExecutionSchema.parse(input.execution);
  const seen = new Set<string>();
  const results: LegacyExecutionResult[] = [];
  for (const value of input.projects) {
    if (
      !scope.some((project) => project === value.project) ||
      seen.has(value.project)
    )
      throw new Error('割当外または重複したproject結果があります。');
    seen.add(value.project);
    const partial = legacyExecutionResultsSchema.parse(value.results);
    checkProject({ ...input, project: value.project }, partial);
    results.push(...partial);
  }
  if (seen.size !== scope.length)
    throw new Error('割当projectの結果が揃っていません。');
  const entries = new Map(execution.entries.map((entry) => [entry.key, entry]));
  // 制御annotationの失敗は上のtrusted検査で先に拒否する。
  return legacySafeResultsSchema.parse(
    results.map((result) => {
      const entry = entries.get(result.key);
      return {
        ...result,
        annotations:
          !isNil(entry) &&
          (entry.disposition === 'existing-skip' ||
            entry.disposition === 'existing-fixme')
            ? [entry.expectedAnnotation]
            : [],
      };
    }),
  );
};
