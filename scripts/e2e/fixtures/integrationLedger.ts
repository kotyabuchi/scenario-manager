import { integrationCollectionSchema } from '../integrationSchema';
import { loadLedger } from '../ledger';

import { resolve } from 'node:path';

/** 承認済みの実台帳から、DB不要の登録照合fixtureだけを作る。 */
export const integrationLedgerFixture = async () => {
  const ledger = await loadLedger(resolve('.'));
  const cases = ledger.scenarios
    .flatMap(({ cases }) => cases)
    .filter((item) => item.layer === 'integration');
  for (const item of cases) item.status = 'implemented';
  const registrations = cases.flatMap((item) =>
    item.executions.flatMap((execution) =>
      item.testBindings.map((binding) => ({
        claim: { caseId: item.caseId, variant: execution.variant, binding },
        testId: `${item.caseId}:${execution.variant}:${binding}`,
        file: 'src/schedule.integration.test.ts',
        titlePath: [item.caseId, execution.variant, binding],
        fullName: `${item.caseId} ${execution.variant} ${binding}`,
        line: 10,
        column: 3,
        options: {
          mode: 'run',
          fails: false,
          concurrent: false,
          retry: 0,
          repeats: 0,
        },
      })),
    ),
  );
  const collection = integrationCollectionSchema.parse({
    schemaVersion: 1,
    runner: {
      name: 'vitest',
      version: '3.2.4',
      project: 'integration',
      pool: 'threads',
      fileParallelism: false,
      maxWorkers: 1,
      includeTaskLocation: true,
    },
    config: 'vitest.integration.collect.config.ts',
    registrations,
    discovery: {
      schemaVersion: 1,
      profile: 'integration',
      projects: [
        {
          name: 'integration',
          testDir: 'src',
          dependencies: [],
          repeatEach: 1,
        },
      ],
      errors: [],
      tests: registrations.map((row) => ({
        testId: row.testId,
        file: row.file,
        line: row.line,
        column: row.column,
        titlePath: row.titlePath,
        project: 'integration',
        repeatEachIndex: 0,
        tags: [
          `@case:${row.claim.caseId}`,
          `@variant:${row.claim.variant}`,
          `@binding:${row.claim.binding}`,
        ],
        expectedStatus: 'passed',
        annotations: [],
        isSetup: false,
      })),
    },
  });
  return { ledger, collection };
};
