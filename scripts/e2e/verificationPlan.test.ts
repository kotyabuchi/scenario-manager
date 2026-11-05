import { describe, expect, it } from 'vitest';

import { discoverySchema } from './discoverySchema';
import { integrationLedgerFixture } from './fixtures/integrationLedger';
import { verificationFixture } from './fixtures/verification';
import { createVerificationPlan } from './verificationPlan';

describe('全実行条件のverification plan', () => {
  it('2binding×2repeatとsetupを分離し、legacy例外は明示集合だけ保持する', () => {
    const { plan, discovery, ledger } = verificationFixture();
    const before = structuredClone({ discovery, ledger });
    expect(
      plan.requirements.filter(({ kind }) => kind === 'business'),
    ).toHaveLength(4);
    expect(
      plan.requirements.filter(({ kind }) => kind === 'setup'),
    ).toHaveLength(1);
    expect(plan.allowedExtraTests).toHaveLength(2);
    const setup = plan.requirements.find(({ kind }) => kind === 'setup');
    for (const row of plan.requirements.filter(
      ({ kind }) => kind === 'business',
    ))
      expect(row.dependencies).toEqual([setup?.key]);
    expect({ discovery, ledger }).toEqual(before);
  });

  it.each([
    'binding',
    'repeat',
    'skip',
    'empty',
    'cycle',
    'setup-missing',
    'setup-failed',
    'extra-unknown',
    'extra-duplicate',
  ])('%sの不正・不足を拒否する', (fault) => {
    const { ledger, discovery, plan } = verificationFixture();
    let extras = plan.allowedExtraTests.map(({ key: _key, ...extra }) => extra);
    const first = discovery.tests[0];
    const setup = discovery.tests.find(({ isSetup }) => isSetup);
    if (first === undefined || setup === undefined)
      throw new Error('fixture不足');
    if (fault === 'binding')
      discovery.tests = discovery.tests.filter(
        ({ titlePath }) => titlePath.at(-1) !== 'second',
      );
    if (fault === 'repeat')
      discovery.tests = discovery.tests.filter(
        ({ testId }) => testId !== 'first-1',
      );
    if (fault === 'skip') first.annotations.push({ type: 'skip' });
    if (fault === 'empty') ledger.scenarios = [];
    if (fault === 'cycle') {
      const project = discovery.projects.find(({ name }) => name === 'setup');
      if (project) project.dependencies = ['desktop'];
    }
    if (fault === 'setup-missing')
      discovery.tests = discovery.tests.filter(({ isSetup }) => !isSetup);
    if (fault === 'setup-failed') setup.expectedStatus = 'failed';
    if (fault === 'extra-unknown') {
      const extra = extras[0];
      if (extra) extra.test = { ...extra.test, testId: 'unknown' };
    }
    if (fault === 'extra-duplicate') extras = [...extras, ...extras];
    expect(() =>
      createVerificationPlan({
        ledger,
        discoveries: [discovery],
        allowedExtraTests: extras,
      }),
    ).toThrow();
  });

  it('現行28caseの55業務登録を全profileで展開する', async () => {
    const { ledger, collection } = await integrationLedgerFixture();
    const reports = ledger.profiles
      .filter(({ id }) => id !== 'integration')
      .map((profile) => {
        const rows = ledger.scenarios
          .flatMap(({ cases }) => cases)
          .filter(({ status }) => status === 'implemented')
          .flatMap((item) =>
            item.executions
              .filter(({ profile: id }) => id === profile.id)
              .flatMap((execution) =>
                item.testBindings.map((binding) => ({
                  item,
                  execution,
                  binding,
                })),
              ),
          );
        return discoverySchema.parse({
          schemaVersion: 1,
          profile: profile.id,
          errors: [],
          projects: profile.executions.map(({ project }) => ({
            name: project,
            testDir: 'e2e',
            dependencies: [],
            repeatEach: 1,
          })),
          tests: rows.map(({ item, execution, binding }, index) => ({
            testId: `${item.caseId}:${execution.variant}:${execution.project}:${binding}`,
            file: `e2e/${profile.id}.spec.ts`,
            line: index + 1,
            column: 1,
            titlePath: [item.caseId, execution.variant, binding],
            project: execution.project,
            repeatEachIndex: 0,
            tags: [
              `@case:${item.caseId}`,
              `@variant:${execution.variant}`,
              `@binding:${binding}`,
            ],
            expectedStatus: 'passed',
            annotations: [],
            isSetup: false,
          })),
        });
      });
    const plan = createVerificationPlan({
      ledger,
      discoveries: [...reports, collection.discovery],
      integrationCollection: collection,
    });
    expect(plan.requirements).toHaveLength(55);
    expect(
      Object.fromEntries(
        ['app', 'isolated', 'storybook', 'integration'].map((profile) => [
          profile,
          plan.requirements.filter((row) => row.profile === profile).length,
        ]),
      ),
    ).toEqual({ app: 18, isolated: 8, storybook: 9, integration: 20 });
    const first = collection.registrations[0];
    if (first === undefined) throw new Error('fixture不足');
    first.options.repeats = 1;
    expect(() =>
      createVerificationPlan({
        ledger,
        discoveries: [...reports, collection.discovery],
        integrationCollection: collection,
      }),
    ).toThrow();
  });
});
