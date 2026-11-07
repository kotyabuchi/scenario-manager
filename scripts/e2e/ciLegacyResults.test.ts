import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import { validateCiLegacyResults } from './ciLegacyResults';
import { verificationFixture } from './fixtures/verification';
import { legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { legacyAppEntries } from './legacySelection';
import { verificationReportSchema } from './verificationSchema';

import { readFileSync } from 'node:fs';

const fixture = () => {
  const legacy = legacyManifestSchema.parse(
    JSON.parse(readFileSync('e2e/ledger/legacy-tests.generated.json', 'utf8')),
  );
  const execution = legacyExecutionSchema.parse(
    JSON.parse(readFileSync('e2e/ledger/legacy-execution.json', 'utf8')),
  );
  const scope = ['chromium', 'chromium-auth'] as const;
  const byKey = new Map(execution.entries.map((entry) => [entry.key, entry]));
  const entries = legacyAppEntries(legacy);
  const stages = scope.map((project) => {
    const shell = verificationFixture();
    const selected = entries.filter(
      (entry) =>
        entry.project === project &&
        byKey.get(entry.key)?.disposition !== 'deferred-live',
    );
    const rows = selected.map((entry) => {
      const disposition = byKey.get(entry.key);
      if (!disposition) throw new Error('実行正本fixture不足');
      const skipped = 'expectedAnnotation' in disposition;
      return {
        key: entry.key,
        fingerprint: entry.fingerprint,
        ...(disposition.disposition === 'replacement'
          ? { originFingerprint: disposition.fingerprint }
          : {}),
        status: skipped ? ('skipped' as const) : ('passed' as const),
        expectedStatus: skipped ? ('skipped' as const) : ('passed' as const),
        annotations: skipped ? [disposition.expectedAnnotation] : [],
      };
    });
    return {
      ...shell.stage,
      context: { ...shell.stage.context, stageId: `app-${project}` },
      legacyResults: rows,
      report: verificationReportSchema.parse({
        ...shell.report,
        profile: 'app',
        tests: selected.map((entry, index) => {
          const row = rows[index];
          if (!row) throw new Error('実行行fixture不足');
          return {
            testId: entry.key,
            file: entry.file,
            line: 1,
            column: 1,
            titlePath: entry.titlePath,
            project,
            repeatEachIndex: 0,
            expectedStatus: row.expectedStatus,
            annotations: row.annotations,
            outcome: row.status === 'skipped' ? 'skipped' : 'expected',
            results: [
              {
                retry: 0,
                status: row.status,
                errorCount: 0,
                annotations: row.annotations,
              },
            ],
          };
        }),
      }),
    };
  });
  return { legacy, execution, scope, stages };
};

describe('CI legacyの正本・共通report照合', () => {
  it.each(
    (['test', 'attempt'] as const).flatMap((target) =>
      (
        [
          'reason',
          'missing',
          'duplicate',
          'unexpected',
          'passed-control',
        ] as const
      ).map((fault) => ({ target, fault })),
    ),
  )('共通reportの$target側だけの$fault改変を拒否する', ({ target, fault }) => {
    const value = fixture();
    const test = value.stages
      .flatMap((stage) => stage.report.tests)
      .find(
        ({ expectedStatus }) =>
          expectedStatus ===
          (fault === 'passed-control' ? 'passed' : 'skipped'),
      );
    const attempt = test?.results[0];
    if (!test || !attempt) throw new Error('制御注釈fixture不足');
    const annotation = test.annotations[0];
    if (fault !== 'passed-control' && !annotation)
      throw new Error('承認注釈fixture不足');
    const changed =
      fault === 'reason'
        ? test.annotations.map((entry) => ({
            ...entry,
            description: 'unapproved reason',
          }))
        : fault === 'missing'
          ? []
          : fault === 'duplicate'
            ? [...test.annotations, ...test.annotations]
            : [
                ...test.annotations,
                { type: 'fail', description: 'unapproved control' },
              ];
    if (target === 'test') test.annotations = changed;
    else attempt.annotations = changed;
    expect(() => validateCiLegacyResults(value)).toThrow();
  });

  it('正当な制御注釈を保った任意の追加注釈は受け入れる', () => {
    const value = fixture();
    for (const test of value.stages.flatMap((stage) => stage.report.tests)) {
      test.annotations = [
        ...test.annotations,
        { type: 'custom', description: 'test note' },
      ];
      for (const attempt of test.results)
        attempt.annotations = [
          ...attempt.annotations,
          { type: 'custom', description: 'attempt note' },
        ];
    }
    expect(validateCiLegacyResults(value)).toHaveLength(165);
  });

  it('現行の置換・承認skip/fixmeを含む割当実行行を照合する', () => {
    const value = fixture();
    expect(validateCiLegacyResults(value)).toHaveLength(165);
  });

  it.each([
    'missing',
    'extra',
    'duplicate',
    'fingerprint',
    'origin',
    'skip',
    'report-status',
    'report-key',
    'deferred',
    'scope',
  ])('%sの改変を拒否する', (fault) => {
    const value = fixture();
    const stage = value.stages[0];
    const row = stage?.legacyResults[0];
    if (!stage || !row) throw new Error('stage fixture不足');
    if (fault === 'missing') stage.legacyResults.pop();
    else if (fault === 'extra')
      stage.legacyResults.push({ ...row, key: 'unknown' });
    else if (fault === 'duplicate') stage.legacyResults.push(row);
    else if (fault === 'fingerprint') row.fingerprint = '0'.repeat(64);
    else if (fault === 'origin') {
      const replacement = value.stages
        .flatMap((value) => value.legacyResults)
        .find((entry) => !isNil(entry.originFingerprint));
      if (!replacement) throw new Error('置換fixture不足');
      replacement.originFingerprint = '0'.repeat(64);
    } else if (fault === 'skip') {
      const skipped = value.stages
        .flatMap((s) => s.legacyResults)
        .find((entry) => entry.status === 'skipped');
      if (!skipped) throw new Error('skip fixture不足');
      skipped.annotations = [
        { type: 'skip', description: 'wrong approved reason' },
      ];
    } else if (fault === 'report-status') {
      const test = stage.report.tests[0];
      const attempt = test?.results[0];
      if (!attempt) throw new Error('report fixture不足');
      attempt.status = 'skipped';
    } else if (fault === 'report-key') {
      const test = stage.report.tests[0];
      if (!test) throw new Error('report fixture不足');
      test.titlePath = ['different'];
    } else if (fault === 'deferred') {
      const deferred = value.execution.entries.find(
        ({ disposition }) => disposition === 'deferred-live',
      );
      if (!deferred) throw new Error('deferred fixture不足');
      stage.legacyResults.push({
        ...row,
        key: deferred.key,
        fingerprint: deferred.fingerprint,
      });
    } else stage.context.stageId = 'app-mobile-chrome';
    expect(() => validateCiLegacyResults(value)).toThrow();
  });
});
