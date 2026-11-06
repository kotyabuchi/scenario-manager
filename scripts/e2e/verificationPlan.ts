import { isNil } from 'ramda';

import { bindDiscovery } from './discoveryBindings';
import { discoverySchema } from './discoverySchema';
import { integrationCollectionSchema } from './integrationSchema';
import { executionKey } from './ledgerIdentity';
import { legacyKey } from './legacy';
import { readTestTags } from './testTags';
import { verificationPlanSchema } from './verificationSchema';

import { isDeepStrictEqual } from 'node:util';

import type { Ledger } from '../../e2e/ledger/schema';
import type { DiscoveredTest, Discovery } from './discoverySchema';
import type {
  VerificationExtraTest,
  VerificationRequirement,
} from './verificationSchema';

/** runnerの元IDとproject/repeatを保持し、profileを跨ぐ同名IDを混同しない。 */
export const verificationTestKey = (
  profile: string,
  test: Pick<DiscoveredTest, 'testId' | 'project' | 'repeatEachIndex'>,
) => JSON.stringify([profile, test.project, test.testId, test.repeatEachIndex]);

const cleanDeclaration = (test: DiscoveredTest) =>
  test.expectedStatus === 'passed' &&
  !test.annotations.some(({ type }) =>
    ['skip', 'fixme', 'fail', 'only', 'todo'].includes(type),
  );

/** implementedの全binding/repeatとrunner依存を展開する。legacy実行分は親の明示した完全集合だけ許可する。 */
export const createVerificationPlan = (input: {
  ledger: Ledger;
  discoveries: Discovery[];
  integrationCollection?: unknown;
  allowedExtraTests?: Omit<VerificationExtraTest, 'key'>[];
}) => {
  const reports = input.discoveries.map((report) =>
    discoverySchema.parse(report),
  );
  const bound = bindDiscovery(input.ledger, reports);
  if (bound.issues.length > 0)
    throw new Error('検証登録と台帳が一致しません。');
  const sources = new Map<string, { profile: string; test: DiscoveredTest }>();
  for (const report of reports) {
    if (report.errors.length > 0) throw new Error('列挙が失敗しています。');
    for (const test of report.tests) {
      const key = verificationTestKey(report.profile, test);
      if (sources.has(key)) throw new Error('列挙identityが重複しています。');
      sources.set(key, { profile: report.profile, test });
    }
  }
  const requirements = new Map<string, VerificationRequirement>();
  for (const item of input.ledger.scenarios.flatMap(({ cases }) => cases)) {
    const registrations = bound.registrations.filter(
      ({ caseId }) => caseId === item.caseId,
    );
    if (item.status === 'planned') {
      if (registrations.length > 0)
        throw new Error('planned caseに登録があります。');
      continue;
    }
    for (const execution of item.executions)
      for (const binding of item.testBindings) {
        const matches = registrations.filter(
          (row) =>
            row.binding === binding &&
            executionKey(row.execution) === executionKey(execution),
        );
        const repeats = matches[0]?.repeatEach;
        if (
          isNil(repeats) ||
          matches.length !== repeats ||
          new Set(matches.map(({ repeatEachIndex }) => repeatEachIndex))
            .size !== repeats ||
          matches.some(
            (row) =>
              row.repeatEach !== repeats || row.repeatEachIndex >= repeats,
          )
        )
          throw new Error('必須bindingまたはrepeat登録が不足しています。');
        for (const row of matches) {
          const found = [...sources.values()].filter(
            (source) =>
              source.profile === execution.profile &&
              JSON.stringify([source.profile, source.test.testId]) ===
                row.testId &&
              source.test.repeatEachIndex === row.repeatEachIndex,
          );
          const source = found[0];
          if (
            found.length !== 1 ||
            isNil(source) ||
            source.test.isSetup ||
            !cleanDeclaration(source.test)
          )
            throw new Error('必須登録が一意でないか実行不能です。');
          if (
            execution.profile === 'integration' &&
            (repeats !== 1 || row.repeatEachIndex !== 0)
          )
            throw new Error('Vitest repeatは未対応です。');
          const key = verificationTestKey(source.profile, source.test);
          if (requirements.has(key))
            throw new Error('必須登録が二重計上されています。');
          requirements.set(key, {
            key,
            profile: source.profile,
            runtime: execution.runtime,
            kind: 'business',
            test: source.test,
            claim: { caseId: item.caseId, variant: execution.variant, binding },
            execution,
            checks: item.checks,
            dependencies: [],
          });
        }
      }
  }
  if (requirements.size === 0) throw new Error('必須業務登録が空です。');
  const integration = reports.find(({ profile }) => profile === 'integration');
  if (!isNil(integration)) {
    const collection = integrationCollectionSchema.parse(
      input.integrationCollection,
    );
    if (
      !isDeepStrictEqual(collection.discovery, integration) ||
      collection.registrations.length !== integration.tests.length
    )
      throw new Error('Vitest収集sidecarが一致しません。');
    for (const test of integration.tests) {
      const sides = collection.registrations.filter(
        ({ testId }) => testId === test.testId,
      );
      const side = sides[0];
      if (
        sides.length !== 1 ||
        isNil(side) ||
        side.file !== test.file ||
        side.line !== test.line ||
        side.column !== test.column ||
        !isDeepStrictEqual(side.titlePath, test.titlePath) ||
        !isDeepStrictEqual(side.claim, readTestTags(test.tags)) ||
        side.options.mode !== 'run' ||
        side.options.fails ||
        side.options.concurrent ||
        side.options.retry !== 0 ||
        side.options.repeats !== 0
      )
        throw new Error('Vitest登録optionsまたはclaimが不正です。');
    }
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const dependenciesFor = (
    profile: string,
    projectName: string,
    runtime: VerificationRequirement['runtime'],
  ): string[] => {
    const report = reports.find((report) => report.profile === profile);
    const project = report?.projects.find(({ name }) => name === projectName);
    if (isNil(report) || isNil(project))
      throw new Error('runner依存projectがありません。');
    const projectKey = JSON.stringify([profile, projectName]);
    if (visiting.has(projectKey))
      throw new Error('runner依存が循環しています。');
    if (visited.has(projectKey))
      return report.tests
        .filter((test) => test.project === projectName)
        .map((test) => verificationTestKey(profile, test));
    visiting.add(projectKey);
    const childKeys = project.dependencies.flatMap((dependency) =>
      dependenciesFor(profile, dependency, runtime),
    );
    const tests = report.tests.filter((test) => test.project === projectName);
    if (tests.length === 0) throw new Error('runner依存登録が空です。');
    for (const test of tests) {
      const key = verificationTestKey(profile, test);
      const current = requirements.get(key);
      if (!isNil(current)) {
        current.dependencies = [
          ...new Set([...current.dependencies, ...childKeys]),
        ].sort();
        continue;
      }
      if (!cleanDeclaration(test))
        throw new Error('runner依存登録が実行不能です。');
      requirements.set(key, {
        key,
        profile,
        runtime,
        kind: test.isSetup ? 'setup' : 'dependency',
        test,
        claim: null,
        execution: null,
        checks: [],
        dependencies: [...new Set(childKeys)].sort(),
      });
    }
    visiting.delete(projectKey);
    visited.add(projectKey);
    return tests.map((test) => verificationTestKey(profile, test));
  };
  // 業務project自身の未登録testは自動必須化せず、明示したrunner依存だけを追加する。
  for (const requirement of [...requirements.values()]) {
    const report = reports.find(
      ({ profile }) => profile === requirement.profile,
    );
    const project = report?.projects.find(
      ({ name }) => name === requirement.test.project,
    );
    if (isNil(project)) throw new Error('業務projectがありません。');
    requirement.dependencies = [
      ...new Set(
        project.dependencies.flatMap((dependency) =>
          dependenciesFor(requirement.profile, dependency, requirement.runtime),
        ),
      ),
    ].sort();
  }
  const extras = (input.allowedExtraTests ?? []).map((extra) => ({
    ...extra,
    key: verificationTestKey(extra.profile, extra.test),
  }));
  const extraKeys = new Set<string>();
  for (const extra of extras) {
    const source = sources.get(extra.key);
    if (
      extraKeys.has(extra.key) ||
      requirements.has(extra.key) ||
      isNil(source) ||
      !isDeepStrictEqual(source.test, extra.test) ||
      extra.profile !== 'app' ||
      extra.test.isSetup ||
      extra.runtime !== 'next-production' ||
      extra.legacy.disposition === 'deferred-live' ||
      extra.legacy.disposition === 'replacement' ||
      extra.legacy.key !== legacyKey(extra.profile, extra.test)
    )
      throw new Error('legacy余分実行の許可集合が不正です。');
    extraKeys.add(extra.key);
  }
  return verificationPlanSchema.parse({
    schemaVersion: 1,
    requirements: [...requirements.values()].sort((left, right) =>
      left.key < right.key ? -1 : left.key > right.key ? 1 : 0,
    ),
    allowedExtraTests: extras.sort((left, right) =>
      left.key < right.key ? -1 : left.key > right.key ? 1 : 0,
    ),
  });
};
