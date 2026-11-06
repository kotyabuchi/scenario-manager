import { isNil } from 'ramda';

import { bindDiscovery } from './discoveryBindings';
import {
  integrationCollectionSchema,
  integrationExpectationSchema,
} from './integrationSchema';
import { readTestTags } from './testTags';

import { isDeepStrictEqual } from 'node:util';

import type { Ledger } from '../../e2e/ledger/schema';
import type { IntegrationExpectation } from './integrationSchema';

// Batch 10の初期受入条件。台帳からの削除も正常な0件として扱わない。
const REQUIRED_VARIANTS = {
  'schedule-action-allow': ['creator-only', 'keeper-only'],
  'schedule-action-deny': ['anonymous', 'outsider', 'phase-recruiting'],
  'schedule-action-invalid': ['empty', 'reversed', 'off-grid', 'overlap'],
  'schedule-rpc-allow': ['creator-only', 'keeper-only'],
  'schedule-rpc-deny': ['anonymous', 'outsider', 'actor-mismatch'],
  'schedule-rpc-atomic': ['creator-atomic-failure', 'keeper-atomic-failure'],
  'schedule-calendar-missing-user': ['creator-only'],
  'schedule-calendar-user-sessions': ['creator-only'],
  'schedule-calendar-summary': ['creator-only'],
  'schedule-calendar-unconfirmed': ['creator-only'],
};

/** 他runnerの不足を混ぜず、integrationの契約・case・例外を同じ条件で切り出す。 */
export const scopeIntegrationLedger = (ledger: Ledger): Ledger => ({
  ...ledger,
  scenarios: ledger.scenarios
    .map((scenario) => ({
      ...scenario,
      cases: scenario.cases.filter(
        (item) =>
          item.layer === 'integration' &&
          item.executions.some(({ profile }) => profile === 'integration'),
      ),
    }))
    .filter(({ cases }) => cases.length > 0),
  contracts: ledger.contracts
    .map((contract) => ({
      ...contract,
      requirements: contract.requirements
        .map((requirement) => ({
          ...requirement,
          executions: requirement.executions.filter(
            ({ profile }) => profile === 'integration',
          ),
        }))
        .filter(({ executions }) => executions.length > 0),
    }))
    .filter(({ requirements }) => requirements.length > 0),
  exceptions: ledger.exceptions.filter(
    ({ deficiency }) => deficiency.profile === 'integration',
  ),
});

/** 標準runnerの収集位置・optionsと台帳を一対一照合し、実行前の必要集合を固定する。 */
export const createIntegrationExpectations = (
  ledger: Ledger,
  input: unknown,
): IntegrationExpectation[] => {
  const collection = integrationCollectionSchema.parse(input);
  const { discovery, runner, registrations: sidecars } = collection;
  const project = discovery.projects[0];
  if (
    collection.config !== 'vitest.integration.collect.config.ts' ||
    runner.pool !== 'threads' ||
    runner.fileParallelism ||
    runner.maxWorkers !== 1 ||
    !runner.includeTaskLocation ||
    discovery.profile !== 'integration' ||
    discovery.errors.length > 0 ||
    discovery.projects.length !== 1 ||
    isNil(project) ||
    project.name !== 'integration' ||
    project.repeatEach !== 1 ||
    project.dependencies.length !== 0
  )
    throw new Error('integrationの収集設定が一致しません。');
  const scoped = scopeIntegrationLedger(ledger);
  const { registrations, issues } = bindDiscovery(scoped, [discovery]);
  if (issues.length > 0)
    throw new Error('integrationの台帳と登録が一致しません。');
  const expected: IntegrationExpectation[] = [];
  for (const item of scoped.scenarios.flatMap(({ cases }) => cases)) {
    if (item.status !== 'implemented') continue;
    if (item.fixture !== 'schedule')
      throw new Error('integrationに未対応fixtureが混入しています。');
    for (const execution of item.executions) {
      if (
        execution.profile !== 'integration' ||
        execution.project !== 'integration' ||
        execution.runtime !== 'vitest-node' ||
        !execution.actorBindings.some(({ role }) => role === 'operator')
      )
        throw new Error('integrationの実行条件が不正です。');
      for (const binding of item.testBindings) {
        const matches = registrations.filter(
          (entry) =>
            entry.caseId === item.caseId &&
            entry.binding === binding &&
            isDeepStrictEqual(entry.execution, execution),
        );
        const match = matches[0];
        const test = discovery.tests.find(
          ({ testId }) =>
            match?.testId === JSON.stringify(['integration', testId]),
        );
        const sides = sidecars.filter((row) => row.testId === test?.testId);
        const side = sides[0];
        if (
          matches.length !== 1 ||
          isNil(match) ||
          isNil(test) ||
          sides.length !== 1 ||
          isNil(side) ||
          match.repeatEach !== 1 ||
          test.repeatEachIndex !== 0 ||
          test.project !== 'integration' ||
          test.isSetup ||
          test.expectedStatus !== 'passed' ||
          test.annotations.some(({ type }) =>
            ['skip', 'fixme', 'fail', 'todo', 'only'].includes(type),
          ) ||
          side.options.mode !== 'run' ||
          side.options.fails ||
          side.options.concurrent ||
          side.options.retry !== 0 ||
          side.options.repeats !== 0 ||
          side.file !== test.file ||
          side.line !== test.line ||
          side.column !== test.column ||
          !isDeepStrictEqual(side.titlePath, test.titlePath)
        )
          throw new Error('integrationの登録が欠落・重複・実行不能です。');
        const claim = {
          caseId: item.caseId,
          variant: execution.variant,
          binding,
        };
        if (
          !isDeepStrictEqual(side.claim, claim) ||
          !isDeepStrictEqual(readTestTags(test.tags), claim)
        )
          throw new Error('integrationのclaimが一致しません。');
        expected.push(
          integrationExpectationSchema.parse({
            test,
            claim,
            options: side.options,
            actorBindings: execution.actorBindings,
            fixture: item.fixture,
            checks: item.checks,
          }),
        );
      }
    }
  }
  if (
    expected.length !== discovery.tests.length ||
    expected.length !== sidecars.length ||
    new Set(expected.map(({ test }) => test.testId)).size !== expected.length
  )
    throw new Error('integrationに未知・重複・planned登録があります。');
  for (const [caseId, variants] of Object.entries(REQUIRED_VARIANTS))
    for (const variant of variants)
      if (
        expected.filter(
          ({ claim }) =>
            claim.caseId === caseId &&
            claim.variant === variant &&
            claim.binding === 'main',
        ).length !== 1
      )
        throw new Error('日程integrationの初期必須条件が不足しています。');
  return expected;
};
