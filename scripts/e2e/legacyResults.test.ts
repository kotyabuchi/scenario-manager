import { describe, expect, it } from 'vitest';

import { legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import {
  aggregateLegacyResults,
  parseLegacyProjectResults,
} from './legacyResults';
import { createLegacySelection } from './legacySelection';

import { readFileSync } from 'node:fs';

import type {
  JSONReportSpec,
  JSONReportSuite,
  JSONReportTest,
} from 'playwright/types/testReporter';

const legacy = legacyManifestSchema.parse(
  JSON.parse(readFileSync('e2e/ledger/legacy-tests.generated.json', 'utf8')),
);
const execution = legacyExecutionSchema.parse(
  JSON.parse(readFileSync('e2e/ledger/legacy-execution.json', 'utf8')),
);
const input = () => ({
  legacy: structuredClone(legacy),
  execution: structuredClone(execution),
  currentLegacy: legacyManifestSchema.parse({
    ...structuredClone(legacy),
    registered: structuredClone(
      legacy.registered.filter((entry) => entry.profile === 'app'),
    ),
    setups: [],
  }),
  project: 'chromium',
});
const reportFor = (project: string) => {
  const value = { ...input(), project };
  const selection = createLegacySelection(value);
  let expected = 0;
  let skipped = 0;
  const suites: JSONReportSuite[] = selection.entries.map((entry) => {
    const disposition = execution.entries.find(
      (item) => item.key === entry.key,
    );
    if (!disposition) throw new Error('実行先が空です。');
    const isSkipped =
      disposition.disposition === 'existing-skip' ||
      disposition.disposition === 'existing-fixme';
    if (isSkipped) skipped += 1;
    else expected += 1;
    const annotations = (
      'expectedAnnotation' in disposition
        ? [disposition.expectedAnnotation]
        : entry.annotations
    ).map(({ type, description }) =>
      typeof description === 'string' ? { type, description } : { type },
    );
    const file = entry.file.slice(4);
    const root: JSONReportSuite = {
      title: file,
      file,
      line: 0,
      column: 0,
      specs: [],
      suites: [],
    };
    let current = root;
    for (const title of entry.titlePath.slice(0, -1)) {
      const child: JSONReportSuite = {
        title,
        file,
        line: 1,
        column: 1,
        specs: [],
        suites: [],
      };
      current.suites = [child];
      current = child;
    }
    current.specs.push({
      title: entry.titlePath.at(-1) ?? '',
      file,
      line: 1,
      column: 1,
      id: entry.key,
      ok: true,
      tags:
        disposition.disposition === 'replacement'
          ? [
              `case:${disposition.replacement.caseId}`,
              `variant:${disposition.replacement.variant}`,
              `binding:${disposition.replacement.binding}`,
            ]
          : [],
      tests: [
        {
          projectName: project,
          projectId: project,
          timeout: 30000,
          status: isSkipped ? 'skipped' : 'expected',
          expectedStatus: isSkipped ? 'skipped' : 'passed',
          annotations,
          results: [
            {
              status: isSkipped ? 'skipped' : 'passed',
              retry: 0,
              errors: [],
              error: undefined,
              annotations,
              workerIndex: 0,
              parallelIndex: 0,
              duration: 1,
              startTime: new Date(0).toISOString(),
              stdout: [],
              stderr: [],
              attachments: [],
            },
          ],
        },
      ],
    });
    return root;
  });
  const report = {
    config: {
      projects: [{ name: project, id: project, retries: 0, repeatEach: 1 }],
    },
    suites,
    errors: [] as unknown[],
    stats: { expected, skipped, unexpected: 0, flaky: 0 },
  };
  const firstSuite = suites[0];
  if (!firstSuite) throw new Error('reportが空です。');
  let current = firstSuite;
  while (current.suites?.[0]) current = current.suites[0];
  const spec = current.specs[0];
  const test = spec?.tests[0];
  const attempt = test?.results[0];
  if (!spec || !test || !attempt) throw new Error('reportが空です。');
  return { value, report, spec, test, attempt };
};

const reportSpecs = (suites: JSONReportSuite[]): JSONReportSpec[] =>
  suites.flatMap((suite) => [
    ...suite.specs,
    ...reportSpecs(suite.suites ?? []),
  ]);

const reportTests = (suites: JSONReportSuite[]): JSONReportTest[] =>
  suites.flatMap((suite) => [
    ...suite.specs.flatMap((spec) => spec.tests),
    ...reportTests(suite.suites ?? []),
  ]);
const withLocation = (test: JSONReportTest, location: unknown) => {
  test.annotations = test.annotations.map((annotation) => ({
    ...annotation,
    location,
  }));
  for (const attempt of test.results)
    attempt.annotations = attempt.annotations.map((annotation) => ({
      ...annotation,
      location,
    }));
};

describe('旧test公式JSON結果の照合', () => {
  it('replacement成功には新本文と旧originの対応を保持する', () => {
    const { value, report } = reportFor('chromium-auth');
    const results = parseLegacyProjectResults({ ...value, report });
    const replaced = results.filter(
      (result) => result.originFingerprint !== undefined,
    );
    expect(replaced).toHaveLength(9);
    for (const result of replaced) {
      expect(result.fingerprint).not.toBe(result.originFingerprint);
      expect(
        value.currentLegacy.registered.find((entry) => entry.key === result.key)
          ?.fingerprint,
      ).toBe(result.fingerprint);
      expect(
        execution.entries.find((entry) => entry.key === result.key)
          ?.fingerprint,
      ).toBe(result.originFingerprint);
    }
  });

  it.each([
    'missing',
    'case',
    'variant',
    'binding',
    'duplicate',
    'leading-at',
  ] as const)('replacement reportの%sタグ改変を拒否する', (mode) => {
    const { value, report } = reportFor('chromium-auth');
    const spec = reportSpecs(report.suites).find((entry) =>
      entry.tags.some((tag) => tag.startsWith('case:')),
    );
    if (!spec) throw new Error('replacement reportが空です。');
    if (mode === 'missing') spec.tags = [];
    else if (mode === 'duplicate') spec.tags.push('case:duplicate');
    else if (mode === 'leading-at')
      spec.tags = spec.tags.map((tag) => `@${tag}`);
    else
      spec.tags = spec.tags.map((tag) =>
        tag.startsWith(`${mode}:`) ? `${mode}:different` : tag,
      );
    expect(() => parseLegacyProjectResults({ ...value, report })).toThrow();
  });
  it('Playwright 1.57のlocation付き既存skipを正規化しmobileの48成功+9skipを受理する', () => {
    const { value, report } = reportFor('mobile-chrome');
    for (const test of reportTests(report.suites))
      withLocation(test, {
        file: 'C:\\worktree\\e2e\\scenarios\\routing.spec.ts',
        line: 8,
        column: 10,
      });
    const results = parseLegacyProjectResults({ ...value, report });
    expect(results).toHaveLength(57);
    expect(results.filter((result) => result.status === 'passed')).toHaveLength(
      48,
    );
    expect(
      results.filter((result) => result.status === 'skipped'),
    ).toHaveLength(9);
    expect(
      results
        .flatMap((result) => result.annotations)
        .some((annotation) => 'location' in annotation),
    ).toBe(false);
  });

  it.each(
    [
      null,
      {},
      { file: '', line: 8, column: 10 },
      { file: 123, line: 8, column: 10 },
      { file: '/repo/e2e/test.spec.ts', line: 0, column: 10 },
      { file: '/repo/e2e/test.spec.ts', line: 1.5, column: 10 },
      { file: '/repo/e2e/test.spec.ts', line: 8, column: -1 },
      { file: '/repo/e2e/test.spec.ts', line: 8, column: 10, extra: true },
    ].map((location) => ({ location })),
  )('不正なannotation locationを拒否する: $location', ({ location }) => {
    const { value, report } = reportFor('mobile-chrome');
    const test = reportTests(report.suites).find(
      (test) => test.status === 'skipped',
    );
    if (!test) throw new Error('skip fixtureがありません。');
    withLocation(test, location);
    expect(() => parseLegacyProjectResults({ ...value, report })).toThrow();
  });

  it('location正規化後もtestとattemptのannotation identity不一致を拒否する', () => {
    const { value, report } = reportFor('mobile-chrome');
    const test = reportTests(report.suites).find(
      (test) => test.status === 'skipped',
    );
    const attempt = test?.results[0];
    if (!test || !attempt) throw new Error('skip fixtureがありません。');
    withLocation(test, { file: '/repo/e2e/test.spec.ts', line: 8, column: 10 });
    attempt.annotations = attempt.annotations.map((annotation) => ({
      ...annotation,
      description: '変更した理由',
    }));
    expect(() => parseLegacyProjectResults({ ...value, report })).toThrow(
      'annotation',
    );
  });

  it('未知のannotation種別を既存skipとして正規化しない', () => {
    const { value, report } = reportFor('mobile-chrome');
    const test = reportTests(report.suites).find(
      (test) => test.status === 'skipped',
    );
    if (!test) throw new Error('skip fixtureがありません。');
    test.annotations = test.annotations.map((annotation) => ({
      ...annotation,
      type: 'unknown-skip',
    }));
    for (const attempt of test.results)
      attempt.annotations = test.annotations.map((annotation) => ({
        ...annotation,
      }));
    withLocation(test, { file: '/repo/e2e/test.spec.ts', line: 8, column: 10 });
    expect(() => parseLegacyProjectResults({ ...value, report })).toThrow(
      'project結果',
    );
  });
  it('各project単独の部分結果を検証し、全4project330件を集約する', () => {
    const projects = [
      ...new Set(legacy.tests.map((entry) => entry.project)),
    ].map((project) => {
      const { value, report } = reportFor(project);
      return {
        project,
        results: parseLegacyProjectResults({ ...value, report }),
      };
    });
    expect(projects[0]?.results.length).toBeLessThan(330);
    expect(aggregateLegacyResults({ ...input(), projects })).toHaveLength(330);
    expect(() =>
      aggregateLegacyResults({ ...input(), projects: projects.slice(0, 1) }),
    ).toThrow('全project');
    expect(() =>
      aggregateLegacyResults({
        ...input(),
        projects: [...projects, ...projects.slice(0, 1)],
      }),
    ).toThrow('重複');
  });

  it.each([
    'errors',
    'stats',
    'unexpected',
    'flaky',
    'retry',
    'attempts',
    'status',
    'expectedStatus',
    'annotation',
    'attemptError',
    'project',
    'unknown',
    'missing',
    'duplicate',
  ] as const)('reportの%s不整合を拒否する', (mode) => {
    const { value, report, spec, test, attempt } = reportFor('chromium');
    if (mode === 'errors') report.errors.push({ message: 'runner-error' });
    if (mode === 'stats') report.stats.expected += 1;
    if (mode === 'unexpected') report.stats.unexpected = 1;
    if (mode === 'flaky') report.stats.flaky = 1;
    if (mode === 'retry') attempt.retry = 1;
    if (mode === 'attempts') test.results.push(attempt);
    if (mode === 'status') attempt.status = 'failed';
    if (mode === 'expectedStatus') test.expectedStatus = 'failed';
    if (mode === 'annotation')
      test.annotations = [{ type: 'skip', description: 'new skip' }];
    if (mode === 'attemptError') attempt.errors.push({ message: 'error' });
    if (mode === 'project') test.projectName = 'mobile-chrome';
    if (mode === 'unknown') spec.title = 'unknown';
    if (mode === 'missing') report.suites.pop();
    if (mode === 'duplicate') {
      const first = report.suites[0];
      if (!first) throw new Error('reportが空です。');
      report.suites[1] = first;
    }
    expect(() => parseLegacyProjectResults({ ...value, report })).toThrow();
  });

  it('reportにfingerprintがなくても現在discoveryの不一致を拒否する', () => {
    const { value, report } = reportFor('chromium');
    const first = value.currentLegacy.tests[0];
    if (!first) throw new Error('fixtureが空です。');
    first.fingerprint = '0'.repeat(64);
    expect(() => parseLegacyProjectResults({ ...value, report })).toThrow(
      'identity/本文/状態',
    );
  });

  it('deferred結果をlocal成功に混ぜない', () => {
    const { value, report, spec } = reportFor('chromium-auth');
    const deferred = execution.entries.find(
      (entry) =>
        entry.disposition === 'deferred-live' &&
        legacy.tests.some(
          (original) =>
            original.key === entry.key && original.project === value.project,
        ),
    );
    const original = legacy.tests.find((entry) => entry.key === deferred?.key);
    if (!original) throw new Error('deferredが空です。');
    const file = original.file.slice(4);
    const root: JSONReportSuite = {
      title: file,
      file,
      line: 0,
      column: 0,
      specs: [],
      suites: [],
    };
    let current = root;
    for (const title of original.titlePath.slice(0, -1)) {
      const child: JSONReportSuite = {
        title,
        file,
        line: 1,
        column: 1,
        specs: [],
        suites: [],
      };
      current.suites = [child];
      current = child;
    }
    spec.file = file;
    spec.title = original.titlePath.at(-1) ?? '';
    current.specs = [spec];
    report.suites[0] = root;
    expect(() => parseLegacyProjectResults({ ...value, report })).toThrow(
      'deferred',
    );
  });
});
