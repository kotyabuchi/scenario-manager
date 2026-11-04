import { isNil } from 'ramda';

import { discoverySchema } from './discoverySchema';
import { readTestTags } from './testTags';

import type {
  Ledger,
  LedgerIssue,
  Registration,
} from '../../e2e/ledger/schema';
import type { Discovery } from './discoverySchema';

/** 登録を台帳条件へ対応付ける。actorは宣言値であり、実fixtureの証拠ではない。 */
export const bindDiscovery = (ledger: Ledger, reports: Discovery[]) => {
  const registrations: Registration[] = [];
  const issues: LedgerIssue[] = [];
  const cases = new Map(
    ledger.scenarios
      .flatMap((scenario) => scenario.cases)
      .map((item) => [item.caseId, item]),
  );
  const profiles = new Set<string>();
  const addIssue = (code: string, subject: string, message: string) => {
    issues.push({ code, subject, message });
  };
  for (const input of reports) {
    const report = discoverySchema.parse(input);
    if (profiles.has(report.profile))
      addIssue(
        'DUPLICATE_PROFILE',
        report.profile,
        '同じprofileの列挙結果が重複しています',
      );
    profiles.add(report.profile);
    for (const error of report.errors)
      addIssue('DISCOVERY_ERROR', report.profile, error);
    const projects = new Map(
      report.projects.map((project) => [project.name, project]),
    );
    if (projects.size !== report.projects.length)
      addIssue(
        'DUPLICATE_PROJECT',
        report.profile,
        '同名projectが重複しています',
      );
    const testIds = new Set<string>();
    const repeats = new Map<
      string,
      { indexes: Set<number>; expected: number }
    >();
    for (const test of report.tests) {
      const subject = `${report.profile}:${test.file}:${test.line}`;
      const project = projects.get(test.project);
      if (isNil(project)) {
        addIssue(
          'UNKNOWN_PROJECT',
          subject,
          `設定にないproject ${test.project} です`,
        );
        continue;
      }
      if (testIds.has(test.testId))
        addIssue('DUPLICATE_TEST', subject, 'runner IDが重複しています');
      testIds.add(test.testId);
      const key = JSON.stringify([test.project, test.file, test.titlePath]);
      const repeat = repeats.get(key) ?? {
        indexes: new Set<number>(),
        expected: project.repeatEach,
      };
      if (
        repeat.indexes.has(test.repeatEachIndex) ||
        test.repeatEachIndex >= project.repeatEach
      ) {
        addIssue(
          'INVALID_DISCOVERY_REPEAT',
          subject,
          '繰返し登録の重複または範囲外があります',
        );
      }
      repeat.indexes.add(test.repeatEachIndex);
      repeats.set(key, repeat);
      let tags: ReturnType<typeof readTestTags>;
      try {
        tags = readTestTags(test.tags);
      } catch (error) {
        addIssue(
          'INVALID_TAG',
          subject,
          error instanceof Error ? error.message : '予約タグが不正です',
        );
        continue;
      }
      if (isNil(tags)) continue;
      if (test.isSetup) {
        addIssue(
          'SETUP_CLAIMS_CASE',
          subject,
          'setupを業務caseの担当には数えられません',
        );
        continue;
      }
      const item = cases.get(tags.caseId);
      if (isNil(item) || !item.testBindings.includes(tags.binding)) {
        addIssue(
          'UNKNOWN_CASE_BINDING',
          subject,
          `未知のcase/binding ${tags.caseId}/${tags.binding} です`,
        );
        continue;
      }
      const executions = item.executions.filter(
        (execution) =>
          execution.profile === report.profile &&
          execution.project === test.project &&
          execution.variant === tags.variant,
      );
      const execution = executions[0];
      if (executions.length !== 1 || isNil(execution)) {
        addIssue(
          'AMBIGUOUS_EXECUTION',
          subject,
          `${tags.caseId}/${tags.variant}に一意な台帳実行条件がありません`,
        );
        continue;
      }
      registrations.push({
        testId: JSON.stringify([report.profile, test.testId]),
        caseId: tags.caseId,
        binding: tags.binding,
        layer: item.layer,
        execution,
        repeatEachIndex: test.repeatEachIndex,
        repeatEach: project.repeatEach,
      });
    }
    for (const [key, repeat] of repeats) {
      if (repeat.indexes.size !== repeat.expected)
        addIssue(
          'MISSING_DISCOVERY_REPEAT',
          key,
          '設定されたrepeatの登録が欠落しています',
        );
    }
  }
  return { registrations, issues };
};
