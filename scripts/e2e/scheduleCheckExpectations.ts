import { isNil } from 'ramda';

import { bindDiscovery } from './discoveryBindings';
import { discoverySchema } from './discoverySchema';

import { isDeepStrictEqual } from 'node:util';

import type { Ledger } from '../../e2e/ledger/schema';
import type { DiscoveredTest } from './discoverySchema';

const PROJECTS = ['chromium', 'mobile-chrome'];
const control = (values: { type: string }[]) =>
  values.some(({ type }) => ['skip', 'fixme', 'fail'].includes(type));
type ScheduleExpectation = {
  test: DiscoveredTest;
  caseId: string;
  variant: string;
  binding: string;
  operator: string;
  observer: string | undefined;
};
/** Batch 9のimplemented集合を列挙へ対応させ、最初の4条件の削減も拒否する。 */
export const createScheduleExpectations = (
  ledger: Ledger,
  input: unknown,
): ScheduleExpectation[] => {
  const discovery = discoverySchema.parse(input);
  if (
    discovery.profile !== 'isolated' ||
    discovery.errors.length > 0 ||
    discovery.projects.length !== 2 ||
    PROJECTS.some(
      (name) =>
        discovery.projects.filter(
          (project) =>
            project.name === name &&
            project.repeatEach === 1 &&
            project.dependencies.length === 0,
        ).length !== 1,
    )
  )
    throw new Error('日程のisolated列挙設定が一致しません。');
  const { registrations, issues } = bindDiscovery(ledger, [discovery]);
  if (issues.length > 0) throw new Error('日程caseの登録対応が不正です。');
  const cases = ledger.scenarios
    .flatMap(({ cases }) => cases)
    .filter(
      (item) =>
        item.layer === 'browser' &&
        item.executions.some(({ profile }) => profile === 'isolated'),
    );
  const expected: ScheduleExpectation[] = [];
  for (const item of cases.filter(({ status }) => status === 'implemented')) {
    if (item.fixture !== 'schedule')
      throw new Error('日程以外のisolated fixtureが混入しています。');
    for (const execution of item.executions.filter(
      ({ profile }) => profile === 'isolated',
    )) {
      const operator = execution.actorBindings.find(
        ({ role }) => role === 'operator',
      )?.actor;
      const observer = execution.actorBindings.find(
        ({ role }) => role === 'observer',
      )?.actor;
      if (
        !['creator-only', 'keeper-only'].includes(operator ?? '') ||
        (!isNil(observer) && observer !== 'confirmed-player') ||
        (item.caseId === 'schedule-confirm-persist' && isNil(observer)) ||
        execution.actorBindings.length !== (isNil(observer) ? 1 : 2) ||
        execution.runtime !== 'next-production'
      )
        throw new Error('日程の実actor条件が不正です。');
      for (const binding of item.testBindings) {
        const matches = registrations.filter(
          (registration) =>
            registration.caseId === item.caseId &&
            registration.binding === binding &&
            isDeepStrictEqual(registration.execution, execution),
        );
        const match = matches[0];
        const test = discovery.tests.find(
          ({ testId }) =>
            match?.testId === JSON.stringify(['isolated', testId]),
        );
        if (
          matches.length !== 1 ||
          isNil(match) ||
          isNil(test) ||
          match.repeatEach !== 1 ||
          test.repeatEachIndex !== 0 ||
          test.isSetup ||
          test.expectedStatus !== 'passed' ||
          control(test.annotations) ||
          isNil(operator)
        )
          throw new Error('日程の必須登録が欠落または実行不能です。');
        expected.push({
          test,
          caseId: item.caseId,
          variant: execution.variant,
          binding,
          operator,
          observer,
        });
      }
    }
  }
  if (
    expected.length !== discovery.tests.length ||
    new Set(expected.map(({ test }) => test.testId)).size !== expected.length
  )
    throw new Error('日程の列挙に未知・重複・planned登録があります。');
  for (const project of PROJECTS)
    for (const variant of ['creator-only', 'keeper-only']) {
      if (
        expected.filter(
          (entry) =>
            entry.caseId === 'schedule-confirm-persist' &&
            entry.variant === variant &&
            entry.operator === variant &&
            entry.test.project === project &&
            entry.binding === 'main',
        ).length !== 1
      )
        throw new Error('日程確定の必要4条件が不足しています。');
    }
  return expected;
};
export type { ScheduleExpectation };
