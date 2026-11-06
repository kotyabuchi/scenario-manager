import { isNil } from 'ramda';

import { bindDiscovery } from './discoveryBindings';
import { discoverySchema } from './discoverySchema';

import { isDeepStrictEqual } from 'node:util';

import type { Ledger } from '../../e2e/ledger/schema';
import type { DiscoveredTest } from './discoverySchema';

const PROJECTS = ['chromium', 'mobile-chrome'];
const APPLICATION_CASE = 'session-application-round-trip';
const APPLICATION_FIXTURE = 'session-application';
const APPLICATION_ACTIONS = [
  'action:src/app/(main)/sessions/[id]/actions.ts#applyToSessionAction',
  'action:src/app/(main)/sessions/[id]/actions.ts#cancelApplicationAction',
];
const control = (values: { type: string }[]) =>
  values.some(({ type }) => ['skip', 'fixme', 'fail'].includes(type));
type ScheduleExpectation = {
  test: DiscoveredTest;
  caseId: string;
  variant: string;
  binding: string;
  fixture: 'schedule' | typeof APPLICATION_FIXTURE;
  operator: string;
  observer: string | undefined;
};
/** isolatedの実登録と照合し、日程4条件と申請の両projectを必須にする。 */
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
    throw new Error('isolatedの列挙設定が一致しません。');
  const { registrations, issues } = bindDiscovery(ledger, [discovery]);
  if (issues.length > 0) throw new Error('isolated caseの登録対応が不正です。');
  const cases = ledger.scenarios
    .flatMap(({ cases }) => cases)
    .filter(
      (item) =>
        item.layer === 'browser' &&
        item.executions.some(({ profile }) => profile === 'isolated'),
    );
  const expected: ScheduleExpectation[] = [];
  for (const item of cases.filter(({ status }) => status === 'implemented')) {
    const fixture =
      item.caseId === APPLICATION_CASE ? APPLICATION_FIXTURE : 'schedule';
    if (item.fixture !== fixture)
      throw new Error('isolated caseのfixtureが一致しません。');
    if (
      fixture === APPLICATION_FIXTURE &&
      (!isDeepStrictEqual(item.testBindings, ['main']) ||
        !isDeepStrictEqual([...item.roles].sort(), ['observer', 'operator']) ||
        item.executions.length !== PROJECTS.length ||
        item.checks.length !== APPLICATION_ACTIONS.length ||
        APPLICATION_ACTIONS.some(
          (target) =>
            !item.checks.some(
              (check) =>
                check.target === target &&
                check.aspect === 'persist' &&
                check.layer === 'browser',
            ),
        ))
    )
      throw new Error('参加申請の登録条件または永続化の検証が不足しています。');
    for (const execution of item.executions.filter(
      ({ profile }) => profile === 'isolated',
    )) {
      const operator = execution.actorBindings.find(
        ({ role }) => role === 'operator',
      )?.actor;
      const observer = execution.actorBindings.find(
        ({ role }) => role === 'observer',
      )?.actor;
      const hasExpectedActors =
        fixture === APPLICATION_FIXTURE
          ? operator === 'applicant' &&
            observer === 'creator-only' &&
            execution.variant === 'applicant'
          : ['creator-only', 'keeper-only'].includes(operator ?? '') &&
            (isNil(observer) || observer === 'confirmed-player') &&
            (item.caseId !== 'schedule-confirm-persist' || !isNil(observer));
      if (
        !hasExpectedActors ||
        execution.actorBindings.length !== (isNil(observer) ? 1 : 2) ||
        execution.runtime !== 'next-production'
      )
        throw new Error('isolatedの実actor条件が不正です。');
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
          throw new Error('isolatedの必須登録が欠落または実行不能です。');
        expected.push({
          test,
          caseId: item.caseId,
          variant: execution.variant,
          binding,
          fixture,
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
    throw new Error('isolatedの列挙に未知・重複・planned登録があります。');
  for (const project of PROJECTS) {
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
    if (
      expected.filter(
        (entry) =>
          entry.fixture === APPLICATION_FIXTURE &&
          entry.test.project === project,
      ).length !== 1
    )
      throw new Error('参加申請の必要2条件が不足しています。');
  }
  return expected;
};
export type { ScheduleExpectation };
